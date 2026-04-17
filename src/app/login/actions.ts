"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { isAllowedEmailDomain } from "@/lib/auth/allowed-domains";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type ActionResult = { ok: true } | { ok: false; message: string };

function err(msg: string): ActionResult {
  return { ok: false, message: msg };
}

export async function sendEmailOtp(email: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return err("Supabase is not configured.");
  }
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !isAllowedEmailDomain(trimmed)) {
    return err("Use an allowed Deloitte work email.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: trimmed,
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) {
    return err(error.message);
  }
  return { ok: true };
}

export async function verifyEmailOtp(email: string, token: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return err("Supabase is not configured.");
  }
  const trimmed = email.trim().toLowerCase();
  const code = token.replace(/\D/g, "").slice(0, 8);
  if (!trimmed || !isAllowedEmailDomain(trimmed)) {
    return err("Invalid email.");
  }
  if (code.length < 6) {
    return err("Enter the code from your email.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    email: trimmed,
    token: code,
    type: "email",
  });

  if (error) {
    return err(error.message);
  }

  redirect("/");
}

export async function signInWithUsernamePassword(
  username: string,
  password: string,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return err("Supabase is not configured.");
  }
  const u = username.trim();
  if (!u || !password) {
    return err("Username and password are required.");
  }

  let email: string | null = null;
  try {
    const admin = createSupabaseServiceClient();
    const { data, error } = await admin
      .from("profiles")
      .select("email")
      .eq("username", u.toLowerCase())
      .maybeSingle();
    if (error) {
      return err("Could not sign in. Try again.");
    }
    email = data?.email ?? null;
  } catch {
    return err("Server configuration error.");
  }

  if (!email) {
    return err("Unknown username or wrong password.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return err("Unknown username or wrong password.");
  }

  redirect("/");
}

function getPublicSiteOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit?.startsWith("http")) {
    return explicit.replace(/\/$/, "");
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}

export async function requestPasswordReset(email: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return err("Supabase is not configured.");
  }
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !isAllowedEmailDomain(trimmed)) {
    return err("Use an allowed Deloitte work email.");
  }

  const supabase = await createSupabaseServerClient();
  const base = getPublicSiteOrigin();
  const redirectTo = `${base}/auth/callback?next=${encodeURIComponent("/auth/reset-password")}`;

  const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
    redirectTo,
  });

  if (error) {
    return err(error.message);
  }
  return { ok: true };
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
