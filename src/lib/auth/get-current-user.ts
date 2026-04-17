import { redirect } from "next/navigation";
import { currentUser as mockUser } from "@/lib/mock-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { SessionAppUser } from "@/lib/auth/types";
import type { ProfileRow } from "@/lib/auth/profile-row";

function initialsFromNameOrEmail(name: string | null | undefined, email: string): string {
  const s = (name ?? email.split("@")[0] ?? "?").trim();
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return s.slice(0, 2).toUpperCase() || "?";
}

function mapToSessionUser(
  authEmail: string,
  userId: string,
  profile: ProfileRow | null,
): SessionAppUser {
  const email = profile?.email ?? authEmail;
  const name =
    profile?.display_name?.trim() ||
    profile?.username?.trim() ||
    email.split("@")[0] ||
    "Member";
  const role = profile?.role === "prime_mover" ? "prime_mover" : "designer";
  const joinedAt = profile?.created_at ?? new Date().toISOString();
  const avatar = initialsFromNameOrEmail(profile?.display_name, email);

  return {
    id: userId,
    name,
    email,
    role,
    avatar,
    joinedAt,
    studioId: profile?.studio_id ?? undefined,
    onboardingCompleted: profile?.onboarding_completed ?? false,
  };
}

/**
 * Returns the active member for server components. Uses mock user when Supabase env is unset (local UI).
 * When Supabase is configured and there is no session, redirects to `/login`.
 */
export async function getSessionUser(): Promise<SessionAppUser> {
  if (!isSupabaseConfigured()) {
    return {
      ...mockUser,
      onboardingCompleted: true,
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return mapToSessionUser(user.email, user.id, profile as ProfileRow | null);
}
