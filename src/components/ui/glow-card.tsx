"use client";

import { GlowingEffect } from "@/components/ui/glowing-effect";
import { cn } from "@/lib/utils";

export type GlowCardProps = {
  children: React.ReactNode;
  className?: string;
  /** Padding for inner content area */
  contentClassName?: string;
  spread?: number;
  proximity?: number;
  inactiveZone?: number;
};

export function GlowCard({
  children,
  className,
  contentClassName,
  spread = 40,
  proximity = 64,
  inactiveZone = 0.12,
}: GlowCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-white/[0.08] bg-neutral-950/80 p-1.5 transition hover:border-white/15",
        className,
      )}
    >
      <div className="relative rounded-xl">
        <GlowingEffect
          spread={spread}
          glow
          disabled={false}
          proximity={proximity}
          inactiveZone={inactiveZone}
        />
        <div
          className={cn(
            "relative z-10 rounded-xl border border-white/[0.08] bg-neutral-950/60",
            contentClassName,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
