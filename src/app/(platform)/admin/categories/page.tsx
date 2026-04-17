import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/get-current-user";
import { listCategoriesForAdmin } from "@/lib/categories/repo";
import { CategoriesAdminTable } from "./categories-admin-table";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const me = await getSessionUser();
  if (me.role !== "prime_mover") redirect("/");

  const categories = await listCategoriesForAdmin();

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-white/10 bg-neutral-950/70 p-6">
        <h1 className="text-2xl font-semibold text-neutral-100">Manage categories</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Used across the catalog, filters, and forms.
        </p>
      </header>
      <CategoriesAdminTable initial={categories} />
    </section>
  );
}
