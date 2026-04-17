import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/get-current-user";
import { listSkillsForAdmin } from "@/lib/catalog/repo";
import { getCategoriesMap } from "@/lib/categories/server";
import { SkillsAdminTable } from "./skills-admin-table";

export const dynamic = "force-dynamic";

export default async function AdminSkillsPage() {
  const me = await getSessionUser();
  if (me.role !== "prime_mover") redirect("/");

  const [skills, catMap] = await Promise.all([listSkillsForAdmin(), getCategoriesMap()]);
  const rows = skills.map((s) => ({
    ...s,
    categoryLabel: catMap.get(s.categoryId)?.name ?? "Uncategorized",
  }));

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-neutral-950/70 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-100">Manage skills</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Live catalog — DB rows merged with seed data.
          </p>
        </div>
        <Link
          href="/admin/skills/new"
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          New skill
        </Link>
      </header>

      <SkillsAdminTable items={rows} />
    </section>
  );
}
