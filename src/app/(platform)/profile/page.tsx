"use client";

import Link from "next/link";
import {
  currentUser,
  getCategoryLabel,
  getPublishedSkills,
  getPublishedTools,
  userActivityLog,
  userSkillBadges,
  formatRelativeTime,
} from "@/lib/mock-data";
import { ProfileAdoptionRing } from "@/components/profile-adoption-ring";
import { GlowCard } from "@/components/ui/glow-card";
import { cn } from "@/lib/utils";
import { useMembership } from "@/lib/membership/context";
import { isUsingPlus } from "@/lib/membership/types";
import { StageDisplay } from "@/components/depth-stage-pills";

export default function ProfilePage() {
  const { get, trackedProgress } = useMembership();
  const publishedSkills = getPublishedSkills();

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-neutral-950/70 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/40 text-lg font-semibold text-neutral-100">
            {currentUser.avatar}
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">
              {currentUser.name}
            </h1>
            <p className="text-sm text-neutral-400">{currentUser.email}</p>
            <p className="mt-1 text-xs text-neutral-500">
              Designer · Joined{" "}
              {new Date(currentUser.joinedAt).toLocaleDateString("en-IN", {
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <span className="w-fit rounded-full border border-white/15 px-3 py-1 text-xs text-neutral-400">
          Role: {currentUser.role === "prime_mover" ? "Asra admin" : "Designer"}
        </span>
      </header>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <ProfileAdoptionRing
          atUsingPlus={trackedProgress.atUsingPlus}
          tracked={trackedProgress.tracked}
          pct={trackedProgress.pct}
        />

        <div className="space-y-6">
          <section className="rounded-2xl border border-white/[0.08] bg-neutral-950/70 p-6">
            <h2 className="text-xl font-medium text-neutral-100">Tool journey</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Depth for each tool — not install steps. See each tool’s page for setup checklists.
            </p>
            <ul className="mt-4 space-y-3">
              {getPublishedTools().map((tool) => {
                const m = get("tool", tool.id);
                const stage = m?.stage ?? "aware";
                const tracked = m?.tracked ?? false;
                const inFlow = isUsingPlus(stage);
                return (
                  <li
                    key={tool.id}
                    className="rounded-xl border border-white/[0.08] bg-black/30 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link
                        href={`/tools/${tool.slug}`}
                        className="text-sm font-medium text-neutral-100 hover:text-primary"
                      >
                        {tool.name}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-neutral-500">
                          {getCategoryLabel(tool.categoryId)}
                        </span>
                        <StageDisplay stage={stage} />
                        {tracked ? (
                          <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                            Tracked
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {inFlow ? (
                      <p className="mt-2 text-[11px] text-neutral-600">
                        Using or expert — in your workflow
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-2xl border border-white/[0.08] bg-neutral-950/70 p-6">
            <h2 className="text-xl font-medium text-neutral-100">Skill badges</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {userSkillBadges.map((b) => {
                const skill = publishedSkills.find((s) => s.id === b.skillId);
                if (!skill) return null;
                return (
                  <Link
                    key={b.skillId}
                    href={`/skills/${skill.slug}`}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs transition-colors",
                      b.earned
                        ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-400"
                        : "border-white/15 text-neutral-500 hover:border-white/25",
                    )}
                  >
                    {b.earned ? "✓ " : "○ "}
                    {skill.name}
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-white/[0.08] bg-neutral-950/70 p-6">
            <h2 className="text-xl font-medium text-neutral-100">Recent activity</h2>
            <ul className="mt-4 space-y-3">
              {userActivityLog.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start justify-between gap-4 border-b border-white/5 pb-3 text-sm last:border-0 last:pb-0"
                >
                  <span className="text-neutral-300">{a.label}</span>
                  <time className="shrink-0 text-xs text-neutral-500" dateTime={a.at}>
                    {formatRelativeTime(a.at)}
                  </time>
                </li>
              ))}
            </ul>
          </section>

          <div className="grid gap-3 sm:grid-cols-3">
            <Link href="/tools" className="group block">
              <GlowCard contentClassName="p-4 transition group-hover:border-primary/30">
                <p className="text-sm font-medium text-neutral-100">Explore tools</p>
                <p className="mt-1 text-xs text-neutral-500">Browse the catalog</p>
              </GlowCard>
            </Link>
            <Link href="/tools" className="group block">
              <GlowCard contentClassName="p-4 transition group-hover:border-primary/30">
                <p className="text-sm font-medium text-neutral-100">Log depth</p>
                <p className="mt-1 text-xs text-neutral-500">Open a tool and set stage</p>
              </GlowCard>
            </Link>
            <Link href="/skills" className="group block">
              <GlowCard contentClassName="p-4 transition group-hover:border-primary/30">
                <p className="text-sm font-medium text-neutral-100">Skill packs</p>
                <p className="mt-1 text-xs text-neutral-500">Download resources</p>
              </GlowCard>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
