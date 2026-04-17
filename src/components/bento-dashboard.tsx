"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { GlowCard } from "@/components/ui/glow-card";
import { formatRelativeTime, type FeedItem } from "@/lib/mock-data";
import { useSessionUser } from "@/lib/auth/current-user-context";
import { useMembership } from "@/lib/membership/context";
import { cn } from "@/lib/utils";

type HqMetrics = {
  memberCount: number;
  membersAtUsingPlusPct: number;
  shippedLast30Days: number;
  adoptionVelocityWoWPct: number;
};

const PAGE_SIZE = 6;

function FeedCard({ item }: { item: FeedItem }) {
  const typeLabel =
    item.type === "announcement"
      ? item.subtype?.replace("_", " ") ?? "Update"
      : item.type === "tool"
        ? "Tool"
        : "Skill";

  return (
    <li id={item.id} className="mb-4 break-inside-avoid scroll-mt-28">
      <Link href={item.href} className="group block">
        <GlowCard contentClassName="overflow-hidden">
          {item.coverImage ? (
            <div className="relative aspect-[16/9] w-full border-b border-white/[0.06]">
              <Image
                src={item.coverImage}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                unoptimized={item.coverImage.startsWith("https://placehold")}
              />
            </div>
          ) : null}
          <div className="space-y-2 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                {typeLabel}
              </span>
              <time
                className="text-xs text-neutral-500"
                dateTime={item.createdAt}
              >
                {formatRelativeTime(item.createdAt)}
              </time>
            </div>
            <h3 className="text-sm font-medium leading-snug text-neutral-100 group-hover:text-primary">
              {item.title}
            </h3>
            <p className="line-clamp-3 text-sm leading-relaxed text-neutral-400">
              {item.excerpt}
            </p>
          </div>
        </GlowCard>
      </Link>
    </li>
  );
}

function MiniRing({ pct }: { pct: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg
      className="-rotate-90 shrink-0"
      width="56"
      height="56"
      viewBox="0 0 56 56"
      aria-hidden
    >
      <circle
        cx="28"
        cy="28"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        className="text-white/10"
      />
      <circle
        cx="28"
        cy="28"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        className="text-primary"
      />
    </svg>
  );
}

type BentoDashboardProps = {
  items: FeedItem[];
  hq: HqMetrics;
  studioCity?: string;
  draftCount: number;
};

export function BentoDashboard({ items, hq, studioCity, draftCount }: BentoDashboardProps) {
  const currentUser = useSessionUser();
  const { trackedProgress } = useMembership();
  const allItems = useMemo(() => items, [items]);
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.excerpt.toLowerCase().includes(q) ||
        (i.subtype?.toLowerCase().includes(q) ?? false),
    );
  }, [allItems, query]);

  const visible = useMemo(
    () => filteredItems.slice(0, visibleCount),
    [filteredItems, visibleCount],
  );

  const loadMore = useCallback(() => {
    setVisibleCount((c) => Math.min(c + PAGE_SIZE, filteredItems.length));
  }, [filteredItems.length]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && visibleCount < filteredItems.length) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [filteredItems.length, loadMore, visibleCount]);

  const firstName = currentUser.name.split(" ")[0] ?? "there";
  const welcomeWords = studioCity
    ? `Welcome back, ${firstName}. ${studioCity} studio. Here’s what shipped recently.`
    : `Welcome back, ${firstName}. Here’s what shipped recently.`;

  return (
    <section className="space-y-6">
      <div>
        <TextGenerateEffect
          className="text-2xl font-semibold tracking-tight text-neutral-100 md:text-3xl"
          words={welcomeWords}
        />
        <p className="mt-2 text-sm text-neutral-400">
          Latest releases across tools, skills, and studio announcements — newest first.
        </p>
      </div>

      <GlowCard contentClassName="p-5">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-10">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
              Studio (HQ)
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/[0.06] bg-black/25 p-3">
                <p className="text-[11px] text-neutral-500">
                  Member engagement
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-100">
                  {hq.membersAtUsingPlusPct}%
                </p>
                <p className="mt-2 text-[10px] leading-snug text-neutral-600">
                  Members with ≥1 core tool at using+ across the workspace.
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-black/25 p-3">
                <p className="text-[11px] text-neutral-500">
                  Adoption velocity
                </p>
                <p
                  className={cn(
                    "mt-1 text-2xl font-semibold tabular-nums",
                    hq.adoptionVelocityWoWPct >= 0 ? "text-emerald-400" : "text-rose-400",
                  )}
                >
                  {hq.adoptionVelocityWoWPct >= 0 ? "+" : ""}
                  {hq.adoptionVelocityWoWPct}%
                </p>
                <p className="mt-2 text-[10px] leading-snug text-neutral-600">
                  WoW lift in using+ transitions across members.
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-black/25 p-3">
                <p className="text-[11px] text-neutral-500">Shipped (30d)</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-100">
                  {hq.shippedLast30Days}
                </p>
                <p className="mt-2 text-[10px] leading-snug text-neutral-600">
                  Tools/skills updated or added in the catalog.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center border-t border-white/[0.06] pt-8 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
              You (tracked tools)
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <MiniRing pct={trackedProgress.pct} />
              <div>
                <p className="text-sm text-neutral-300">
                  <span className="font-semibold text-neutral-100">
                    {trackedProgress.atUsingPlus}
                  </span>
                  <span className="text-neutral-500">/{trackedProgress.tracked}</span>{" "}
                  <span className="text-neutral-500">at using+</span>
                </p>
                <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-neutral-500">
                  Only tools you track count toward this ring — not every item in the catalog.
                </p>
              </div>
            </div>
          </div>
        </div>
      </GlowCard>

      {currentUser.role === "prime_mover" && draftCount > 0 ? (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3 text-sm">
          <p className="font-medium text-neutral-100">
            {draftCount} draft{draftCount === 1 ? "" : "s"} in progress
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Not visible in the catalog until published. Continue editing in admin.
          </p>
          <Link
            href="/admin"
            className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
          >
            Open admin dashboard →
          </Link>
        </div>
      ) : null}

      <div className="relative">
        <label htmlFor="feed-search" className="sr-only">
          Search feed
        </label>
        <input
          id="feed-search"
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          placeholder="Search announcements, tools, skills…"
          className="w-full rounded-xl border border-white/[0.08] bg-neutral-950/70 px-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {filteredItems.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/15 bg-neutral-950/40 px-4 py-8 text-center text-sm text-neutral-500">
          No items match “{query.trim()}”.
        </p>
      ) : (
        <ul className="columns-1 gap-4 md:columns-2 lg:columns-3">
          {visible.map((item) => (
            <FeedCard key={item.id} item={item} />
          ))}
        </ul>
      )}

      <div
        ref={sentinelRef}
        className={cn(
          "flex h-8 items-center justify-center text-xs text-neutral-600",
          visibleCount >= filteredItems.length && "hidden",
        )}
      >
        Loading more…
      </div>

      {visibleCount >= filteredItems.length && filteredItems.length > 0 ? (
        <p className="text-center text-xs text-neutral-600">You’re up to date.</p>
      ) : null}
    </section>
  );
}
