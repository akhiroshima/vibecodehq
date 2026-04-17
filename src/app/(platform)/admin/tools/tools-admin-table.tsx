"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { archiveTool } from "@/app/(platform)/admin/catalog/actions";
import type { Tool } from "@/lib/mock-data";

type Row = Tool & { categoryLabel: string };

export function ToolsAdminTable({ items }: { items: Row[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const archive = (id: string) => {
    if (!confirm("Archive this tool?")) return;
    setError(null);
    startTransition(async () => {
      const result = await archiveTool(id);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {items.map((tool) => (
        <div
          key={tool.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/35 p-4"
        >
          <div>
            <p className="text-sm font-medium text-neutral-100">{tool.name}</p>
            <p className="text-xs text-neutral-400">{tool.categoryLabel}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                tool.contentStatus === "published" && "border-emerald-500/40 text-emerald-400",
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => archive(tool.id)}
              >
                {pending ? "…" : "Archive"}
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
