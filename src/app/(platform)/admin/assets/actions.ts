"use server";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getSessionUser } from "@/lib/auth/get-current-user";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const BUCKET = "tool-skill-assets";
const MAX_BYTES = 50 * 1024 * 1024;

export type UploadResult =
  | { ok: true; url: string; path: string; name: string; size: number }
  | { ok: false; message: string };

function safeName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .toLowerCase() || "file";
}

function slugOrTmp(slug: string | null): string {
  if (!slug) return "tmp";
  const s = slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 64);
  return s || "tmp";
}

/**
 * Upload a distribution asset for a tool or skill.
 * Public bucket → returns a stable public URL.
 * Admin-only (prime_mover). Service role bypasses RLS on storage.objects.
 */
export async function uploadDistributionAsset(
  formData: FormData,
): Promise<UploadResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase is not configured." };
  }
  const me = await getSessionUser();
  if (me.role !== "prime_mover") {
    return { ok: false, message: "Admins only." };
  }

  const file = formData.get("file");
  const kind = (formData.get("kind") ?? "").toString();
  const slug = (formData.get("slug") ?? "").toString();

  if (!(file instanceof File)) {
    return { ok: false, message: "No file provided." };
  }
  if (kind !== "tool" && kind !== "skill") {
    return { ok: false, message: "Invalid kind." };
  }
  if (file.size === 0) return { ok: false, message: "File is empty." };
  if (file.size > MAX_BYTES) {
    return { ok: false, message: `File exceeds ${MAX_BYTES / 1024 / 1024} MB limit.` };
  }

  const admin = createSupabaseServiceClient();
  const path = `${kind}/${slugOrTmp(slug)}/${Date.now()}-${safeName(file.name)}`;
  const contentType = file.type || "application/octet-stream";
  const buf = Buffer.from(await file.arrayBuffer());

  const { error } = await admin.storage.from(BUCKET).upload(path, buf, {
    contentType,
    upsert: false,
  });
  if (error) return { ok: false, message: error.message };

  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
  return {
    ok: true,
    url: pub.publicUrl,
    path,
    name: file.name,
    size: file.size,
  };
}

/** Best-effort deletion of a previously uploaded asset. Non-fatal on failure. */
export async function removeDistributionAsset(path: string): Promise<{ ok: boolean }> {
  if (!isSupabaseConfigured()) return { ok: false };
  const me = await getSessionUser();
  if (me.role !== "prime_mover") return { ok: false };
  if (!path.startsWith("tool/") && !path.startsWith("skill/")) return { ok: false };
  const admin = createSupabaseServiceClient();
  const { error } = await admin.storage.from(BUCKET).remove([path]);
  return { ok: !error };
}
