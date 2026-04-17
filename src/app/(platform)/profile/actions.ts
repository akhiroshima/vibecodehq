"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type ChangePwResult = { ok: true } | { ok: false; message: string };

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<ChangePwResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase is not configured." };
  }
  if (newPassword.length < 8) {
    return { ok: false, message: "New password must be at least 8 characters." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { ok: false, message: "Not signed in." };
  }

  const { error: signErr } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (signErr) {
    return { ok: false, message: "Current password is incorrect." };
  }

  const { error: upErr } = await supabase.auth.updateUser({ password: newPassword });
  if (upErr) {
    return { ok: false, message: upErr.message };
  }
  return { ok: true };
}
