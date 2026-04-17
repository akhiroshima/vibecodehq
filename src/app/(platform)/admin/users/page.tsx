import { redirect } from "next/navigation";
import { listAdminUsers } from "@/app/(platform)/admin/users/actions";
import { getSessionUser } from "@/lib/auth/get-current-user";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { listStudios } from "@/lib/studios/repo";
import { UsersAdminTable } from "@/app/(platform)/admin/users/users-table";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  if (!isSupabaseConfigured()) {
    return (
      <section className="rounded-2xl border border-white/[0.08] bg-neutral-950/70 p-6">
        <h1 className="text-2xl font-semibold text-neutral-100">Users</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Supabase is not configured — user management is disabled.
        </p>
      </section>
    );
  }

  const me = await getSessionUser();
  if (me.role !== "prime_mover") {
    redirect("/");
  }

  const [users, studios] = await Promise.all([listAdminUsers(), listStudios()]);
  return <UsersAdminTable users={users} currentUserId={me.id} studios={studios} />;
}
