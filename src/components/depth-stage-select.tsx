"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { adoptionStagePillClass } from "@/lib/mock-data";
import type { AdoptionStage } from "@/lib/membership/types";
import { ExpertStaticGlow } from "@/components/expert-static-glow";
import { cn } from "@/lib/utils";

type DepthStageSelectProps = {
  allowedStages: AdoptionStage[];
  stage: AdoptionStage;
  onStageChange: (stage: AdoptionStage) => void;
  idPrefix?: string;
};

export function DepthStageSelect({
  allowedStages,
  stage,
  onStageChange,
  idPrefix = "depth",
}: DepthStageSelectProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const trigger = (
    <button
      id={`${idPrefix}-trigger`}
      type="button"
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={listId}
      onClick={() => setOpen((o) => !o)}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-[inherit] border border-white/[0.12] bg-black/40 px-3 py-2 text-left text-sm font-medium text-neutral-100 outline-none transition hover:border-white/25 focus-visible:ring-2 focus-visible:ring-primary/40",
        stage === "expert" && "border-transparent",
      )}
    >
      <span className="capitalize">{stage}</span>
      <ChevronDown
        className={cn(
          "h-4 w-4 shrink-0 text-neutral-500 transition",
          open && "rotate-180",
        )}
        aria-hidden
      />
    </button>
  );

  return (
    <div ref={rootRef} className="relative w-full">
      <div className="w-full">
        {stage === "expert" ? (
          <ExpertStaticGlow active roundedClassName="rounded-lg" className="w-full">
            <div className="rounded-[inherit] bg-neutral-950/95 p-[1px]">{trigger}</div>
          </ExpertStaticGlow>
        ) : (
          <div className="rounded-lg">{trigger}</div>
        )}
      </div>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={`${idPrefix}-trigger`}
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-60 overflow-auto rounded-xl border border-white/[0.12] bg-neutral-950 py-1 shadow-xl shadow-black/50"
        >
          {allowedStages.map((s) => {
            const selected = s === stage;
            const isExpert = s === "expert";
            const optionButton = (
              <button
                type="button"
                role="option"
                aria-selected={selected}
                title={depthTitle(s)}
                onClick={() => {
                  onStageChange(s);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition",
                  selected
                    ? "bg-white/[0.06] text-neutral-50"
                    : "text-neutral-300 hover:bg-white/[0.04]",
                )}
              >
                <span
                  className={cn(
                    adoptionStagePillClass(s),
                    "pointer-events-none",
                    isExpert && "border-transparent bg-neutral-950/90 text-emerald-200",
                  )}
                >
                  {s}
                </span>
                {selected ? (
                  <span className="ml-auto text-[10px] font-medium uppercase tracking-wide text-primary">
                    Current
                  </span>
                ) : null}
              </button>
            );

            return (
              <li key={s} className="list-none">
                {isExpert ? (
                  <div className="px-2 py-1">
                    <ExpertStaticGlow active roundedClassName="rounded-lg" className="w-full">
                      <div className="rounded-[inherit] bg-neutral-950/95 p-[1px]">
                        {optionButton}
                      </div>
                    </ExpertStaticGlow>
                  </div>
                ) : (
                  optionButton
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function depthTitle(s: AdoptionStage): string {
  switch (s) {
    case "aware":
      return "Aware — you know it exists";
    case "exploring":
      return "Exploring — trying it out";
    case "using":
      return "Using — in your workflow";
    case "expert":
      return "Expert — teaching others / advanced use";
    default:
      return s;
  }
}
