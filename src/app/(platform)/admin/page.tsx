import Link from "next/link";
import { AdminStatCard } from "@/components/admin-stat-card";
import { loadAdminDashboardData } from "@/lib/metrics/server";
import { listToolsForAdmin, listSkillsForAdmin } from "@/lib/catalog/repo";
import { formatRelativeTime } from "@/lib/mock-data";

export default async function AdminDashboardPage() {
  const [data, allTools, allSkills] = await Promise.all([
    loadAdminDashboardData(),
    listToolsForAdmin(),
    listSkillsForAdmin(),
  ]);

  const draftTools = allTools.filter((t) => t.contentStatus === "draft");
  const draftSkills = allSkills.filter((s) => s.contentStatus === "draft");

  const maxAdoption = Math.max(
    ...data.toolAdoption.map((t) => t.totalMembers),
    1,
  );
  const sortedAdoption = [...data.toolAdoption].sort(
    (a, b) => b.totalMembers - a.totalMembers,
  );

  const velocityColor =
    data.hq.adoptionVelocityWoWPct >= 0 ? "text-emerald-400" : "text-rose-400";

  return (
    <section className="space-y-8">
      <header className="rounded-2xl border border-white/[0.08] bg-neutral-950/70 p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">
          Asra · AI transformation HQ
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Live adoption, coverage, and activity across studios.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard label="Members" value={String(data.hq.memberCount)} />
        <AdminStatCard label="Tools" value={String(data.totalTools)} />
        <AdminStatCard label="Skills" value={String(data.totalSkills)} />
        <AdminStatCard
          label="Using+ members"
          value={`${data.hq.membersAtUsingPlusPct}%`}
        />
      </div>

      <section className="rounded-2xl border border-white/[0.08] bg-neutral-950/70 p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-xl font-medium text-neutral-100">Momentum</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Rolling 7- and 30-day signals from real adoption events.
            </p>
          </div>
          <p className="text-xs text-neutral-500">
            Shipped last 30 days · <span className="text-neutral-200">{data.hq.shippedLast30Days}</span>
          </p>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/[0.06] bg-black/25 p-4">
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">Adoption WoW</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${velocityColor}`}>
              {data.hq.adoptionVelocityWoWPct >= 0 ? "+" : ""}
              {data.hq.adoptionVelocityWoWPct}%
            </p>
            <p className="mt-2 text-[11px] text-neutral-500">
              Change in using+ transitions vs previous week.
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-black/25 p-4">
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">Drafts</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-100">
              {data.draftTools + data.draftSkills}
            </p>
            <p className="mt-2 text-[11px] text-neutral-500">
              {data.draftTools} tools · {data.draftSkills} skills awaiting publish.
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-black/25 p-4">
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">Active studios</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-100">
              {data.studios.filter((s) => s.memberCount > 0).length}
              <span className="text-sm text-neutral-500">/{data.studios.length}</span>
            </p>
            <p className="mt-2 text-[11px] text-neutral-500">
              Studios with at least one onboarded member.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.08] bg-neutral-950/70 p-6">
        <h2 className="text-xl font-medium text-neutral-100">Studio breakdown</h2>
        <p className="mt-1 text-sm text-neutral-500">
          {data.studios.length} studios · using+ share from live memberships.
        </p>
        {data.studios.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">No studios configured yet.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.studios.map((studio) => (
              <div
                key={studio.studioId}
                className="rounded-xl border border-white/[0.08] bg-black/25 p-4"
              >
                <p className="text-sm font-medium text-neutral-100">{studio.city}</p>
                <p className="mt-1 text-xs text-neutral-500">{studio.name} studio</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-neutral-100">
                  {studio.memberCount}
                </p>
                <p className="text-[11px] text-neutral-500">onboarded members</p>
                <p className="mt-3 text-[10px] uppercase tracking-wide text-neutral-500">
                  Using+ {studio.usingPlusPct}%
                </p>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-primary/80 transition-[width]"
                    style={{ width: `${studio.usingPlusPct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {draftTools.length + draftSkills.length > 0 ? (
        <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
          <h2 className="text-xl font-medium text-neutral-100">Drafts</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Not visible in the member catalog until published.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {draftTools.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/admin/tools/${t.id}/edit`}
                  className="text-primary hover:underline"
                >
                  Tool: {t.name}
                </Link>
              </li>
            ))}
            {draftSkills.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/admin/skills/${s.id}/edit`}
                  className="text-primary hover:underline"
                >
                  Skill: {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl border border-white/[0.08] bg-neutral-950/70 p-6">
        <h2 className="text-xl font-medium text-neutral-100">Adoption by tool</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Members tracking each tool · darker bar = share at using+.
        </p>
        {sortedAdoption.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">
            No adoption data yet. Tools appear here once members start tracking them.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {sortedAdoption.map((row) => {
              const totalPct = (row.totalMembers / maxAdoption) * 100;
              const usingPct =
                row.totalMembers === 0
                  ? 0
                  : (row.usingPlus / row.totalMembers) * 100;
              return (
                <li key={row.toolId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-200">{row.name}</span>
                    <span className="tabular-nums text-neutral-400">
                      {row.usingPlus} using+ · {row.totalMembers} tracking
                    </span>
                  </div>
                  <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-white/20"
                      style={{ width: `${totalPct}%` }}
                    />
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-primary/80"
                      style={{ width: `${(totalPct * usingPct) / 100}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-white/[0.08] bg-neutral-950/70 p-6">
        <h2 className="text-xl font-medium text-neutral-100">Recent activity</h2>
        {data.recentActivity.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">
            No recent activity yet. Comments and stage changes will appear here.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {data.recentActivity.map((a) => (
              <li
                key={a.id}
                className="flex items-start justify-between gap-4 border-b border-white/5 pb-3 text-sm last:border-0"
              >
                <span className="text-neutral-300">{a.message}</span>
                <time className="shrink-0 text-xs text-neutral-500" dateTime={a.at}>
                  {formatRelativeTime(a.at)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
