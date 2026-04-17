"use client";

import { GlowCard } from "@/components/ui/glow-card";

type Props = {
  label: string;
  value: string;
  spark?: React.ReactNode;
};

export function AdminStatCard({ label, value, spark }: Props) {
  return (
    <GlowCard contentClassName="p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-neutral-100">
            {value}
          </p>
        </div>
        {spark ?? null}
      </div>
    </GlowCard>
  );
}
