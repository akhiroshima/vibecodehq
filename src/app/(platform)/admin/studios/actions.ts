"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/get-current-user";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type StudioResult = { ok: true } | { ok: false; message: string };

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 48) || "studio"
  );
}

async function requireAdmin(): Promise<StudioResult> {
  if (!isSupabaseConfigured()) return { ok: false, message: "Supabase is not configured." };
  const me = await getSessionUser();
  if (me.role !== "prime_mover") return { ok: false, message: "Admins only." };
  return { ok: true };
}

function revalidateAll() {
  revalidatePath("/admin/studios");
  revalidatePath("/onboarding");
  revalidatePath("/", "layout");
}

export async function createStudio(input: { name: string; city: string }): Promise<StudioResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const name = input.name.trim();
  const city = input.city.trim();
  if (!name || !city) return { ok: false, message: "Name and city are required." };

  const id = `studio_${slugify(city)}`;
  const admin = createSupabaseServiceClient();
  const { error } = await admin.from("studios").insert({ id, name, city, designer_count: 0 });
  if (error) {
    if (error.code === "23505") return { ok: false, message: "Studio with that id already exists." };
    return { ok: false, message: error.message };
  }
  revalidateAll();
  return { ok: true };
}

export async function updateStudio(
  id: string,
  patch: { name?: string; city?: string },
): Promise<StudioResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const updates: Record<string, unknown> = {};
  if (typeof patch.name === "string") {
    const name = patch.name.trim();
    if (!name) return { ok: false, message: "Name cannot be empty." };
    updates.name = name;
  }
  if (typeof patch.city === "string") {
    const city = patch.city.trim();
    if (!city) return { ok: false, message: "City cannot be empty." };
    updates.city = city;
  }
  if (Object.keys(updates).length === 0) return { ok: true };

  const admin = createSupabaseServiceClient();
  const { error } = await admin.from("studios").update(updates).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidateAll();
  return { ok: true };
}

export async function deleteStudio(id: string): Promise<StudioResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const admin = createSupabaseServiceClient();
  const { data: users } = await admin
    .from("profiles")
    .select("id")
    .eq("studio_id", id)
    .limit(1);
  if (users && users.length > 0) {
    return { ok: false, message: "Studio has members assigned. Reassign them first." };
  }
  const { error } = await admin.from("studios").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidateAll();
  return { ok: true };
}
