"use client";

import { ExpertStaticGlow } from "@/components/expert-static-glow";
import { adoptionStagePillClass } from "@/lib/mock-data";
import {
  ADOPTION_STAGES,
  type AdoptionStage,
} from "@/lib/membership/types";
import { cn } from "@/lib/utils";

type Props = {
  stage: AdoptionStage;
  onStageChange: (stage: AdoptionStage) => void;
  /** Optional short labels in tooltips */
  idPrefix?: string;
};

export function DepthStagePills({ stage, onStageChange, idPrefix = "depth" }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Your depth">
      {ADOPTION_STAGES.map((s) => {
        const selected = stage === s;
        const isExpert = s === "expert";
        const pill = (
          <button
            id={`${idPrefix}-${s}`}
            type="button"
            onClick={() => onStageChange(s)}
            title={depthTitle(s)}
            className={cn(
              adoptionStagePillClass(s),
              selected &&
                !isExpert &&
                "ring-1 ring-primary/50 ring-offset-1 ring-offset-neutral-950",
              selected &&
                isExpert &&
                "relative border-transparent bg-neutral-950/90 text-emerald-200",
            )}
          >
            {s}
          </button>
        );

        if (isExpert && selected) {
          return (
            <ExpertStaticGlow key={s} active>
              <span className="inline-flex rounded-[inherit] bg-neutral-950/95 p-[1px]">
                {pill}
              </span>
            </ExpertStaticGlow>
          );
        }

        return <span key={s}>{pill}</span>;
      })}
    </div>
  );
}

/** Read-only badge for lists (e.g. profile) — expert gets always-on rainbow shell. */
export function StageDisplay({ stage }: { stage: AdoptionStage }) {
  const isExpert = stage === "expert";
  const pill = (
    <span
      className={cn(
        adoptionStagePillClass(stage),
        isExpert && "border-transparent bg-neutral-950/90 text-emerald-200",
      )}
    >
      {stage}
    </span>
  );
  if (isExpert) {
    return (
      <ExpertStaticGlow active>
        <span className="inline-flex rounded-[inherit] bg-neutral-950/95 p-[1px]">{pill}</span>
      </ExpertStaticGlow>
    );
  }
  return pill;
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
