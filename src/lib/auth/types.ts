import type { Role } from "@/lib/mock-data";

/** Resolved user for shell + pages (mirrors `AppUser` with onboarding flag). */
export type SessionAppUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  joinedAt: string;
  studioId?: string;
  onboardingCompleted: boolean;
};
