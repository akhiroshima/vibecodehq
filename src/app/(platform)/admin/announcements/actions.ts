"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/get-current-user";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Announcement } from "@/lib/mock-data";

export type AnnouncementInput = {
  title: string;
  body: string;
  type: Announcement["type"];
  pinned: boolean;
  relatedAssetKind?: "tool" | "skill" | null;
  relatedAssetId?: string | null;
};

export type AnnouncementResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

async function requireAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; message: string }
> {
  if (!isSupabaseConfigured()) return { ok: false, message: "Supabase is not configured." };
  const me = await getSessionUser();
  if (me.role !== "prime_mover") return { ok: false, message: "Admins only." };
  return { ok: true, userId: me.id };
}

function revalidateAll() {
  revalidatePath("/admin/announcements");
  revalidatePath("/");
}

function sanitize(input: AnnouncementInput) {
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title) return { error: "Title is required." } as const;
  if (title.length > 160) return { error: "Title must be 160 characters or fewer." } as const;
  if (body.length > 4000) return { error: "Body must be 4000 characters or fewer." } as const;
  return {
    row: {
      title,
      body,
      type: input.type,
      pinned: Boolean(input.pinned),
      related_asset_kind: input.relatedAssetKind || null,
      related_asset_id: input.relatedAssetId || null,
    },
  } as const;
}

export async function createAnnouncement(
  input: AnnouncementInput,
): Promise<AnnouncementResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const s = sanitize(input);
  if ("error" in s) return { ok: false, message: s.error ?? "Invalid input." };

  const admin = createSupabaseServiceClient();
  const { data, error } = await admin
    .from("announcements")
    .insert({ ...s.row!, created_by: guard.userId })
    .select("id")
    .single();
  if (error) return { ok: false, message: error.message };
  revalidateAll();
  return { ok: true, id: data.id };
}

export async function updateAnnouncement(
  id: string,
  input: AnnouncementInput,
): Promise<AnnouncementResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const s = sanitize(input);
  if ("error" in s) return { ok: false, message: s.error ?? "Invalid input." };

  const admin = createSupabaseServiceClient();
  const { error } = await admin.from("announcements").update(s.row!).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidateAll();
  return { ok: true, id };
}

export async function togglePinnedAnnouncement(
  id: string,
  pinned: boolean,
): Promise<AnnouncementResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const admin = createSupabaseServiceClient();
  const { error } = await admin.from("announcements").update({ pinned }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidateAll();
  return { ok: true, id };
}

export async function deleteAnnouncement(
  id: string,
): Promise<AnnouncementResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const admin = createSupabaseServiceClient();
  const { error } = await admin.from("announcements").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidateAll();
  return { ok: true, id };
}
