"use client";

import { GlowCard } from "@/components/ui/glow-card";

type Props = {
  atUsingPlus: number;
  tracked: number;
  pct: number;
};

export function ProfileAdoptionRing({ atUsingPlus, tracked, pct }: Props) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <GlowCard contentClassName="p-8">
      <div className="flex flex-col items-center justify-center">
        <div className="relative h-40 w-40">
          <svg className="-rotate-90" viewBox="0 0 120 120" aria-hidden>
            <circle
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-white/10"
            />
            <circle
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={offset}
              className="text-primary transition-[stroke-dashoffset] duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-3xl font-semibold tabular-nums text-neutral-100">
              {atUsingPlus}
              <span className="text-lg text-neutral-500">/{tracked}</span>
            </p>
            <p className="text-xs text-neutral-500">using+ · tracked</p>
          </div>
        </div>
        <p className="mt-4 text-center text-sm text-neutral-400">
          Tools you track at <span className="text-neutral-200">using</span> or{" "}
          <span className="text-neutral-200">expert</span>
        </p>
        <p className="mt-1 text-2xl font-semibold text-primary">{pct}%</p>
        <p className="mt-4 max-w-[18rem] text-center text-[11px] leading-relaxed text-neutral-500">
          Denominator is your tracked list, not the full catalog — add or remove tools in settings
          when wired.
        </p>
      </div>
    </GlowCard>
  );
}
