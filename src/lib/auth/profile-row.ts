import type { Role } from "@/lib/mock-data";

export type ProfileRow = {
  id: string;
  email: string | null;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: Role;
  studio_id: string | null;
  job_level: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};
