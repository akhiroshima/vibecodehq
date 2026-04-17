import { Globe } from "lucide-react";

type Size = "sm" | "md";

/**
 * Visual marker for tools/skills that originated outside Deloitte and are being
 * re-shared on the platform. Keeps a single source of truth for copy + styling.
 */
export function ExternalBadge({ size = "md" }: { size?: Size }) {
  const padding = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs";
  return (
    <span
      title="Shared from an external source — not built in Deloitte"
      className={`inline-flex items-center gap-1 rounded-full border border-sky-400/40 bg-sky-400/10 font-medium text-sky-300 ${padding}`}
    >
      <Globe className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden />
      External resource
    </span>
  );
}
