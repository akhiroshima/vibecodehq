"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getSessionUser } from "@/lib/auth/get-current-user";
import { isAllowedEmailDomain } from "@/lib/auth/allowed-domains";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Role } from "@/lib/mock-data";

export type AdminUser = {
  id: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
  role: Role;
  studioId: string | null;
  jobLevel: string | null;
  onboardingCompleted: boolean;
  createdAt: string;
};

export type ActionResult = { ok: true } | { ok: false; message: string };

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

export async function listAdminUsers(): Promise<AdminUser[]> {
  const guard = await requireAdmin();
  if (!guard.ok) return [];
  const admin = createSupabaseServiceClient();
  const { data, error } = await admin
    .from("profiles")
    .select(
      "id,email,username,display_name,role,studio_id,job_level,onboarding_completed,created_at",
    )
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id as string,
    email: (r.email as string | null) ?? null,
    username: (r.username as string | null) ?? null,
    displayName: (r.display_name as string | null) ?? null,
    role: (r.role as Role) ?? "designer",
    studioId: (r.studio_id as string | null) ?? null,
    jobLevel: (r.job_level as string | null) ?? null,
    onboardingCompleted: Boolean(r.onboarding_completed),
    createdAt: r.created_at as string,
  }));
}

export async function updateUserField(
  userId: string,
  patch: Partial<{
    role: Role;
    studio_id: string | null;
    job_level: string | null;
    display_name: string | null;
  }>,
): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const me = await getSessionUser();
  if (patch.role && me.id === userId && patch.role !== "prime_mover") {
    return { ok: false, message: "Refusing to demote yourself." };
  }

  const admin = createSupabaseServiceClient();
  const { error } = await admin
    .from("profiles")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function inviteUser(input: {
  email: string;
  role: Role;
  studioId: string;
  jobLevel: string;
}): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const email = input.email.trim().toLowerCase();
  if (!email || !isAllowedEmailDomain(email)) {
    return { ok: false, message: "Email must use an allowed domain." };
  }

  const admin = createSupabaseServiceClient();

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });

  let userId = created?.user?.id;

  if (createErr || !userId) {
    if (createErr && !/already.*registered|User already/i.test(createErr.message)) {
      return { ok: false, message: createErr.message };
    }
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (existing?.id) {
      userId = existing.id as string;
    } else {
      return { ok: false, message: createErr?.message ?? "Could not create user." };
    }
  }

  const { error: upsertErr } = await admin.from("profiles").upsert(
    {
      id: userId,
      email,
      role: input.role,
      studio_id: input.studioId || null,
      job_level: input.jobLevel || null,
      onboarding_completed: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (upsertErr) return { ok: false, message: upsertErr.message };

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const me = await getSessionUser();
  if (me.id === userId) {
    return { ok: false, message: "Refusing to delete yourself." };
  }

  const admin = createSupabaseServiceClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/users");
  return { ok: true };
}
