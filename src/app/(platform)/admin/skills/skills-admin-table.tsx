"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { archiveSkill } from "@/app/(platform)/admin/catalog/actions";
import type { Skill } from "@/lib/mock-data";

type Row = Skill & { categoryLabel: string };

export function SkillsAdminTable({ items }: { items: Row[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const archive = (id: string) => {
    if (!confirm("Archive this skill?")) return;
    setError(null);
    startTransition(async () => {
      const result = await archiveSkill(id);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  };

  return (
    <>
      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((skill) => (
          <div
            key={skill.id}
            className="rounded-xl border border-white/10 bg-black/35 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-neutral-100">{skill.name}</p>
                <p className="mt-1 text-xs text-neutral-400">{skill.categoryLabel}</p>
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => archive(skill.id)}
                >
                  {pending ? "…" : "Archive"}
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
