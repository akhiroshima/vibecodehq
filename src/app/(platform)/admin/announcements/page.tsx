import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/get-current-user";
import { listAnnouncementsForAdmin } from "@/lib/announcements/repo";
import { listToolsForAdmin, listSkillsForAdmin } from "@/lib/catalog/repo";
import { AnnouncementsAdminTable } from "./announcements-admin-table";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const me = await getSessionUser();
  if (me.role !== "prime_mover") redirect("/");

  const [announcements, tools, skills] = await Promise.all([
    listAnnouncementsForAdmin(),
    listToolsForAdmin(),
    listSkillsForAdmin(),
  ]);

  return (
    <section className="space-y-8">
      <header className="rounded-2xl border border-white/10 bg-neutral-950/70 p-6">
        <h1 className="text-2xl font-semibold text-neutral-100">Manage announcements</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Announcements appear in every member&rsquo;s home feed, newest first, with pinned items
          surfaced on top.
        </p>
      </header>
      <AnnouncementsAdminTable
        initial={announcements}
        tools={tools.map((t) => ({ id: t.id, name: t.name }))}
        skills={skills.map((s) => ({ id: s.id, name: s.name }))}
      />
    </section>
  );
}
