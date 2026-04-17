import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/get-current-user";
import { listStudiosForAdmin } from "@/lib/studios/repo";
import { StudiosAdminTable } from "./studios-admin-table";

export const dynamic = "force-dynamic";

export default async function AdminStudiosPage() {
  const me = await getSessionUser();
  if (me.role !== "prime_mover") redirect("/");

  const studios = await listStudiosForAdmin();

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-white/10 bg-neutral-950/70 p-6">
        <h1 className="text-2xl font-semibold text-neutral-100">Manage studios</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Studios power onboarding and profile mapping. Deleting a studio requires reassigning its
          members first.
        </p>
      </header>
      <StudiosAdminTable initial={studios} />
    </section>
  );
}
