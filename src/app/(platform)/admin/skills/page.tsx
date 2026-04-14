"use client";

import Link from "next/link";
import { useState } from "react";
import { getCategoryLabel, skills as seedSkills, type Skill } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function AdminSkillsPage() {
  const [items, setItems] = useState<Skill[]>(() => [...seedSkills]);

  const archive = (id: string) => {
    if (!confirm("Archive this skill? (session-only mock)")) return;
    setItems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, contentStatus: "archived" as const } : s)),
    );
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-neutral-950/70 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-100">Manage skills</h1>
          <p className="mt-1 text-sm text-neutral-400">All skills including drafts.</p>
        </div>
        <Link
          href="/admin/skills/new"
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          New skill
        </Link>
      </header>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((skill) => (
          <div
            key={skill.id}
            className="rounded-xl border border-white/10 bg-black/35 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-neutral-100">{skill.name}</p>
                <p className="mt-1 text-xs text-neutral-400">{getCategoryLabel(skill.categoryId)}</p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase",
                  skill.contentStatus === "published" && "border-emerald-500/40 text-emerald-400",
                  skill.contentStatus === "draft" && "border-amber-500/40 text-amber-400",
                  skill.contentStatus === "archived" && "border-neutral-500/50 text-neutral-500",
                )}
              >
                {skill.contentStatus}
              </span>
            </div>
            <span
              className={`mt-3 inline-block rounded-full border px-2 py-0.5 text-xs ${
                skill.status === "beta"
                  ? "border-amber-400/40 text-amber-400"
                  : "border-emerald-400/40 text-emerald-400"
              }`}
            >
              {skill.status}
            </span>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/admin/skills/${skill.id}/edit`}
                className="text-xs text-primary hover:underline"
              >
                Edit
              </Link>
              {skill.contentStatus !== "archived" ? (
                <Button type="button" variant="outline" size="sm" onClick={() => archive(skill.id)}>
                  Archive
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
