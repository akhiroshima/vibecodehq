import Link from "next/link";
import {
  getDraftSkills,
  getDraftTools,
  getPublishedSkills,
  getPublishedTools,
  designerRecords,
  adoptionHeatmap,
  adminRecentActivity,
  statSparklines,
  formatRelativeTime,
  studioRecords,
  studioUsingPlusFraction,
  type AdoptionStage,
} from "@/lib/mock-data";
import { AdminStatCard } from "@/components/admin-stat-card";

function Sparkline({ values }: { values: number[] }) {
  const w = 120;
  const h = 36;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = 2;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2);
    return `${x},${y}`;
  });
  const d = `M ${pts.join(" L ")}`;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="text-primary/80"
      aria-hidden
    >
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function stageColor(s: AdoptionStage | "none") {
  if (s === "none") return "bg-neutral-800";
  if (s === "aware") return "bg-neutral-600";
  if (s === "exploring") return "bg-amber-500/60";
  if (s === "using") return "bg-primary/70";
  return "bg-emerald-500/80";
}

export default function AdminDashboardPage() {
  const publishedTools = getPublishedTools();
  const draftTools = getDraftTools();
  const draftSkills = getDraftSkills();
  const toolIds = publishedTools.map((t) => t.id);
  const sortedTools = [...publishedTools].sort((a, b) => b.adoptionCount - a.adoptionCount);
  const maxAdoption = Math.max(...publishedTools.map((t) => t.adoptionCount), 1);

  const designersByStudio = studioRecords.map((studio) => ({
    studio,
    designers: designerRecords.filter((d) => d.studioId === studio.id),
  }));

  return (
    <section className="space-y-8">
      <header className="rounded-2xl border border-white/[0.08] bg-neutral-950/70 p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">
          Asra · AI transformation HQ
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Mock dashboard — trends and coverage (backend deferred).
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          label="Studios"
          value={String(studioRecords.length)}
          spark={<Sparkline values={statSparklines.designers} />}
        />
        <AdminStatCard
          label="Active tools"
          value={String(publishedTools.length)}
          spark={<Sparkline values={statSparklines.tools} />}
        />
        <AdminStatCard
          label="Active skills"
          value={String(getPublishedSkills().length)}
          spark={<Sparkline values={statSparklines.skills} />}
        />
        <AdminStatCard
          label="Overall adoption"
          value="61%"
          spark={<Sparkline values={statSparklines.adoption} />}
        />
      </div>

      <section className="rounded-2xl border border-white/[0.08] bg-neutral-950/70 p-6">
        <h2 className="text-xl font-medium text-neutral-100">Studio breakdown</h2>
        <p className="mt-1 text-sm text-neutral-500">
          {studioRecords.length} locations · sample heatmap designers grouped by studio
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {studioRecords.map((studio) => {
            const frac = studioUsingPlusFraction(studio.id);
            return (
              <div
                key={studio.id}
                className="rounded-xl border border-white/[0.08] bg-black/25 p-4"
              >
                <p className="text-sm font-medium text-neutral-100">{studio.city}</p>
                <p className="mt-1 text-xs text-neutral-500">{studio.name} studio</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-neutral-100">
                  {studio.designerCount}
                </p>
                <p className="text-[11px] text-neutral-500">designers (HQ roll-up)</p>
                <p className="mt-3 text-[10px] uppercase tracking-wide text-neutral-500">
                  Using+ (sample) {Math.round(frac * 100)}%
                </p>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-primary/80 transition-[width]"
                    style={{ width: `${frac * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
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
        <ul className="mt-4 space-y-3">
          {sortedTools.map((tool) => (
            <li key={tool.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-200">{tool.name}</span>
                <span className="tabular-nums text-neutral-400">{tool.adoptionCount}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-primary/80"
                  style={{
                    width: `${(tool.adoptionCount / maxAdoption) * 100}%`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-white/[0.08] bg-neutral-950/70 p-6">
        <h2 className="text-xl font-medium text-neutral-100">Coverage heatmap</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Rows grouped by studio · Columns: tools · Depth: stage
        </p>
        <div className="mt-4 space-y-6 overflow-x-auto">
          {designersByStudio.map(({ studio, designers }) => (
            <details key={studio.id} open className="group rounded-xl border border-white/[0.06] bg-black/20">
              <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium text-neutral-200 marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-2">
                  <span className="text-neutral-100">{studio.city}</span>
                  <span className="text-xs font-normal text-neutral-500">
                    {designers.length} designer{designers.length === 1 ? "" : "s"} in sample
                  </span>
                </span>
              </summary>
              {designers.length === 0 ? (
                <p className="px-3 pb-3 text-xs text-neutral-600">No sample designers in mock roster.</p>
              ) : (
                <div className="overflow-x-auto px-2 pb-3">
                  <table className="w-full min-w-[320px] border-collapse text-left text-xs">
                    <thead>
                      <tr>
                        <th className="p-1 text-neutral-500" />
                        {publishedTools.map((t) => (
                          <th
                            key={t.id}
                            className="max-w-[4rem] truncate p-1 text-center text-[10px] font-normal text-neutral-500"
                          >
                            {t.name.split(" ")[0]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {designers.map(({ name }) => (
                        <tr key={`${studio.id}-${name}`}>
                          <td className="whitespace-nowrap p-1 text-neutral-400">{name}</td>
                          {toolIds.map((tid) => {
                            const s = adoptionHeatmap[name]?.[tid] ?? "none";
                            return (
                              <td key={tid} className="p-0.5">
                                <div
                                  className={`mx-auto h-6 w-full max-w-[2rem] rounded ${stageColor(s)}`}
                                  title={`${name} · ${tid}: ${s}`}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </details>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.08] bg-neutral-950/70 p-6">
        <h2 className="text-xl font-medium text-neutral-100">Recent activity</h2>
        <ul className="mt-4 space-y-3">
          {adminRecentActivity.map((a) => (
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
      </section>
    </section>
  );
}
