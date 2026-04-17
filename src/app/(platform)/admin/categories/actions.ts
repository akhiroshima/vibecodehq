"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/get-current-user";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type ActionResult = { ok: true } | { ok: false; message: string };

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 64) || "category"
  );
}

function makeId(slug: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `cat_${slug.replace(/[^a-z0-9]/g, "")}_${rand}`;
}

async function requireAdmin(): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase is not configured." };
  }
  const me = await getSessionUser();
  if (me.role !== "prime_mover") {
    return { ok: false, message: "Admins only." };
  }
  return { ok: true };
}

function revalidateAll() {
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
}

export async function createCategory(input: {
  name: string;
  description?: string;
}): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const name = input.name.trim();
  if (!name) return { ok: false, message: "Name is required." };
  const slug = slugify(name);
  const id = makeId(slug);

  const admin = createSupabaseServiceClient();
  const { error } = await admin.from("categories").insert({
    id,
    name,
    slug,
    description: input.description?.trim() || null,
    sort_order: 100,
  });
  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "A category with that name or slug already exists." };
    }
    return { ok: false, message: error.message };
  }
  revalidateAll();
  return { ok: true };
}

export async function updateCategory(
  id: string,
  patch: { name?: string; description?: string | null; sort_order?: number },
): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const updates: Record<string, unknown> = {};
  if (typeof patch.name === "string") {
    const name = patch.name.trim();
    if (!name) return { ok: false, message: "Name cannot be empty." };
    updates.name = name;
    updates.slug = slugify(name);
  }
  if (patch.description !== undefined) {
    updates.description = patch.description?.trim() || null;
  }
  if (typeof patch.sort_order === "number") {
    updates.sort_order = patch.sort_order;
  }
  if (Object.keys(updates).length === 0) return { ok: true };

  const admin = createSupabaseServiceClient();
  const { error } = await admin.from("categories").update(updates).eq("id", id);
  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "A category with that name or slug already exists." };
    }
    return { ok: false, message: error.message };
  }
  revalidateAll();
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const admin = createSupabaseServiceClient();
  const { data: conflictTool } = await admin
    .from("tools")
    .select("id")
    .eq("category_id", id)
    .limit(1);
  const { data: conflictSkill } = await admin
    .from("skills")
    .select("id")
    .eq("category_id", id)
    .limit(1);
  if ((conflictTool && conflictTool.length) || (conflictSkill && conflictSkill.length)) {
    return {
      ok: false,
      message: "Category is in use by tools or skills. Reassign them first.",
    };
  }

  const { error } = await admin.from("categories").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidateAll();
  return { ok: true };
}
