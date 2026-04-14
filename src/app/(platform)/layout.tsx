import { AppShell } from "@/components/app-shell";
import { MembershipProvider } from "@/lib/membership/context";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <MembershipProvider>
      <AppShell>{children}</AppShell>
    </MembershipProvider>
  );
}
