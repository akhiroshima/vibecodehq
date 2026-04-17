import { AppShell } from "@/components/app-shell";
import { MembershipProvider } from "@/lib/membership/context";
import { CurrentUserProvider } from "@/lib/auth/current-user-context";
import { CategoriesProvider } from "@/lib/categories/context";
import { OnboardingRedirect } from "@/components/auth/onboarding-redirect";
import { getSessionUser } from "@/lib/auth/get-current-user";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { listCategories } from "@/lib/categories/repo";
import { loadMembershipsForCurrentUser } from "@/lib/membership/server";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const needsOnboarding = isSupabaseConfigured() && !user.onboardingCompleted;
  const [categories, initialMemberships] = await Promise.all([
    listCategories(),
    loadMembershipsForCurrentUser(),
  ]);

  return (
    <CurrentUserProvider user={user}>
      <CategoriesProvider initial={categories}>
        <MembershipProvider initial={initialMemberships}>
          {needsOnboarding ? <OnboardingRedirect needsOnboarding /> : null}
          <AppShell>{children}</AppShell>
        </MembershipProvider>
      </CategoriesProvider>
    </CurrentUserProvider>
  );
}
