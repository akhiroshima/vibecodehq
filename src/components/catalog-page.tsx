"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { StageDisplay } from "@/components/depth-stage-pills";
import { HoverEffect } from "@/components/ui/card-hover-effect";
import {
  getPublishedSkills,
  getPublishedTools,
  type Skill,
  type Tool,
} from "@/lib/mock-data";
import { useCategories } from "@/lib/categories/context";
import { useMembership } from "@/lib/membership/context";
import type { AssetKind } from "@/lib/membership/types";
import { cn } from "@/lib/utils";

type CatalogPageProps = {
  kind: "tools" | "skills";
  items?: Tool[] | Skill[];
};

export function CatalogPage({ kind, items }: CatalogPageProps) {
  const { get } = useMembership();
  const { getLabel, filterOptions } = useCategories();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const source: (Tool | Skill)[] =
    items ?? (kind === "tools" ? getPublishedTools() : getPublishedSkills());
  const heading = kind === "tools" ? "Tool catalog" : "Asra skills";
  const searchId = `catalog-search-${kind}`;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return source.filter((item) => {
      const catLabel = getLabel(item.categoryId);
      const categoryMatch = activeCategory === "All" || catLabel === activeCategory;
      const haystack = [item.name, item.tagline, item.description, catLabel]
        .join(" ")
        .toLowerCase();
      const queryMatch = !q || haystack.includes(q);
      return categoryMatch && queryMatch;
    });
  }, [source, activeCategory, query, getLabel]);

  const cardItems = filtered.map((item) => ({
    title: item.name,
    description: `${item.tagline} • ${getLabel(item.categoryId)}`,
    link: `/${kind}/${item.slug}`,
    status:
      kind === "skills" && "status" in item
        ? item.status
        : ("active" as const),
  }));

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-white/[0.08] bg-neutral-950/70 p-5">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">{heading}</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Browse the catalog; open an asset to set your depth (stage) and, for tools, tracked list.
        </p>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
          <label htmlFor={searchId} className="sr-only">
            Search {kind} by name, category, or description
          </label>
          <input
            id={searchId}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${kind} by name, category, or description...`}
            className="min-w-0 flex-1 bg-transparent text-sm text-neutral-100 outline-none placeholder:text-neutral-500"
          />
        </div>
      </header>

      <section className="rounded-2xl border border-white/[0.08] bg-neutral-950/70 p-4">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
          Category
        </p>
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((category) => {
            const active = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition",
                  active
                    ? "border-primary/60 bg-primary/15 text-neutral-100"
                    : "border-white/[0.08] bg-black/25 text-neutral-400 hover:border-white/20 hover:text-neutral-200",
                )}
              >
                {category}
              </button>
            );
          })}
        </div>
      </section>

      {filtered.length ? (
        <HoverEffect
          items={cardItems}
          renderCard={(item: {
            title: string;
            description: string;
            link: string;
            status?: "active" | "beta";
          }) => {
            const status = item.status ?? "active";
            const slug = item.link.split("/").pop() ?? "";
            const assetKind: AssetKind = kind === "tools" ? "tool" : "skill";
            const catalogItem = source.find((c) => c.slug === slug);
            const m = catalogItem
              ? get(assetKind, catalogItem.id)
              : undefined;
            const stage = m?.stage ?? "aware";
            return (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg font-semibold text-neutral-100">{item.title}</h3>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-xs font-medium",
                        status === "beta"
                          ? "border-amber-400/50 bg-amber-400/10 text-amber-400"
                          : "border-emerald-400/50 bg-emerald-400/10 text-emerald-400",
                      )}
                    >
                      {status === "beta" ? "Beta" : "Active"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase tracking-wide text-neutral-600">
                        Depth
                      </span>
                      <StageDisplay stage={stage} />
                    </div>
                  </div>
                </div>
                <p className="text-sm text-neutral-300">{item.description}</p>
                <p className="text-xs text-neutral-500">Click card to open</p>
              </div>
            );
          }}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-white/20 bg-black/30 p-10 text-center">
          <p className="text-lg font-medium text-neutral-200">No {kind} found</p>
          <p className="mt-1 text-sm text-neutral-400">Try a different search or filter.</p>
        </div>
      )}
    </section>
  );
}
