"use client";

import Link from "next/link";
import { useState } from "react";
import { getCategoryLabel, tools as seedTools, type Tool } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function AdminToolsPage() {
  const [items, setItems] = useState<Tool[]>(() => [...seedTools]);

  const archive = (id: string) => {
    if (!confirm("Archive this tool? (session-only mock)")) return;
    setItems((prev) =>
      prev.map((t) => (t.id === id ? { ...t, contentStatus: "archived" as const } : t)),
    );
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-neutral-950/70 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-100">Manage tools</h1>
          <p className="mt-1 text-sm text-neutral-400">Mock CRUD view for content managers.</p>
        </div>
        <Link
          href="/admin/tools/new"
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          New tool
        </Link>
      </header>

      <div className="space-y-3">
        {items.map((tool) => (
          <div
            key={tool.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/35 p-4"
          >
            <div>
              <p className="text-sm font-medium text-neutral-100">{tool.name}</p>
              <p className="text-xs text-neutral-400">{getCategoryLabel(tool.categoryId)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                  tool.contentStatus === "published" &&
                    "border-emerald-500/40 text-emerald-400",
                  tool.contentStatus === "draft" && "border-amber-500/40 text-amber-400",
                  tool.contentStatus === "archived" && "border-neutral-500/50 text-neutral-500",
                )}
              >
                {tool.contentStatus}
              </span>
              <Link
                href={`/admin/tools/${tool.id}/edit`}
                className="rounded-full border border-primary/40 px-3 py-1 text-xs text-primary"
              >
                Edit
              </Link>
              {tool.contentStatus !== "archived" ? (
                <Button type="button" variant="outline" size="sm" onClick={() => archive(tool.id)}>
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
