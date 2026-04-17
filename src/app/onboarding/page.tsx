import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/get-current-user";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { listStudios } from "@/lib/studios/repo";
import { OnboardingForm } from "@/app/onboarding/onboarding-form";

export default async function OnboardingPage() {
  if (!isSupabaseConfigured()) {
    redirect("/");
  }
  const user = await getSessionUser();
  if (user.onboardingCompleted) {
    redirect("/");
  }
  const studios = await listStudios();
  return <OnboardingForm studios={studios} />;
}
