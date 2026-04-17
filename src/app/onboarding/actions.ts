"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type OnboardingResult = { ok: true } | { ok: false; message: string };

function err(m: string): OnboardingResult {
  return { ok: false, message: m };
}

const USERNAME_RE = /^[a-z0-9._-]{3,32}$/;

export async function completeOnboarding(form: {
  username: string;
  password: string;
  displayName: string;
  studioId: string;
  jobLevel: string;
}): Promise<OnboardingResult> {
  if (!isSupabaseConfigured()) {
    return err("Supabase is not configured.");
  }

  const username = form.username.trim().toLowerCase();
  const password = form.password;
  const displayName = form.displayName.trim();
  const studioId = form.studioId.trim();
  const jobLevel = form.jobLevel.trim();

  if (!USERNAME_RE.test(username)) {
    return err("Username: 3–32 chars, lowercase letters, numbers, . _ -");
  }
  if (password.length < 8) {
    return err("Password must be at least 8 characters.");
  }
  if (!displayName) {
    return err("Display name is required.");
  }
  if (!studioId || !jobLevel) {
    return err("Studio and job level are required.");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user?.id || !user.email) {
    return err("Session expired. Sign in again.");
  }

  try {
    const admin = createSupabaseServiceClient();
    const { data: taken } = await admin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (taken && taken.id !== user.id) {
      return err("That username is already taken.");
    }
  } catch {
    return err("Server configuration error (service role).");
  }

  const { error: pwErr } = await supabase.auth.updateUser({ password });
  if (pwErr) {
    return err(pwErr.message);
  }

  const row = {
    id: user.id,
    email: user.email,
    username,
    display_name: displayName,
    avatar_url: null as string | null,
    studio_id: studioId,
    job_level: jobLevel,
    onboarding_completed: true,
    updated_at: new Date().toISOString(),
  };

  const { error: upErr } = await supabase.from("profiles").upsert(row, {
    onConflict: "id",
  });
  if (upErr) {
    return err(upErr.message);
  }

  redirect("/");
}
