"use client";

import { cn } from "@/lib/utils";

type ExpertStaticGlowProps = {
  /** When true, renders the conic “signature” ring (no hover / proximity required). */
  active: boolean;
  children: React.ReactNode;
  className?: string;
  /** Padding of the gradient ring (default matches pill chrome). */
  ringWidthClassName?: string;
  /** Match the inner control shape (pills vs buttons). */
  roundedClassName?: string;
};

/**
 * Always-on rainbow ring for Expert — replaces proximity-based glow for adoption depth.
 */
export function ExpertStaticGlow({
  active,
  children,
  className,
  ringWidthClassName = "p-[2px]",
  roundedClassName = "rounded-full",
}: ExpertStaticGlowProps) {
  if (!active) {
    return <>{children}</>;
  }
  return (
    <span
      className={cn(
        "inline-flex",
        roundedClassName,
        ringWidthClassName,
        "bg-[conic-gradient(from_180deg,#dd7bbb_0%,#d79f1e_25%,#5a922c_50%,#4c7894_75%,#dd7bbb_100%)]",
        className,
      )}
    >
      <span className={cn("flex min-h-0 min-w-0", roundedClassName)}>{children}</span>
    </span>
  );
}
