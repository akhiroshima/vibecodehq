"use client";

import { useEffect } from "react";
import { useMembership } from "@/lib/membership/context";
import { DepthStageSelect } from "@/components/depth-stage-select";
import { buttonVariants } from "@/components/ui/button";
import type { AdoptionStage, AssetKind } from "@/lib/membership/types";
import {
  clampStageToAllowed,
  defaultMembership,
  resolveAdoptionStages,
} from "@/lib/membership/types";
import { cn } from "@/lib/utils";

type AdoptionRailProps = {
  assetKind: AssetKind;
  assetId: string;
  /** Aggregate adoption in the studio (read-only). */
  studioReach: number;
  resourceCount: number;
  /** Admin-defined ladder; last step is always `expert`. Omitted → default four-step ladder. */
  adoptionStages?: AdoptionStage[];
  downloadUrl?: string;
  downloadLabel?: string;
  repoUrl?: string;
};

function repoHostLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("github")) return "View on GitHub";
    if (host.includes("gitlab")) return "View on GitLab";
    if (host.includes("bitbucket")) return "View on Bitbucket";
    return "View repository";
  } catch {
    return "View repository";
  }
}

export function AdoptionRail({
  assetKind,
  assetId,
  studioReach,
  resourceCount,
  adoptionStages: adoptionStagesProp,
  downloadUrl,
  downloadLabel = "Download package",
  repoUrl,
}: AdoptionRailProps) {
  const { get, setStage, setTracked } = useMembership();
  const m =
    get(assetKind, assetId) ?? defaultMembership(assetKind, assetId);
  const allowed = resolveAdoptionStages(adoptionStagesProp);
  const effectiveStage = clampStageToAllowed(m.stage, allowed);

  useEffect(() => {
    if (m.stage !== effectiveStage) {
      setStage(assetKind, assetId, effectiveStage);
    }
  }, [assetKind, assetId, effectiveStage, m.stage, setStage]);

  return (
    <div className="space-y-4 rounded-xl border border-white/[0.08] bg-neutral-950/80 p-5">
      <div>
        <h3 className="text-sm font-medium text-neutral-100">Your depth</h3>
        <p className="mt-1 text-xs text-neutral-500">
          Studio reach:{" "}
          <span className="text-neutral-300 tabular-nums">{studioReach}</span>{" "}
          designers
        </p>
      </div>

      <div>
        <p className="text-xs font-medium text-neutral-500">Stage</p>
        <p className="mt-1 text-[11px] leading-snug text-neutral-600">
          How deeply you use this {assetKind} — separate from install steps below.
        </p>
        <div className="mt-3">
          <DepthStageSelect
            idPrefix={`${assetKind}-${assetId}`}
            allowedStages={allowed}
            stage={effectiveStage}
            onStageChange={(s) => setStage(assetKind, assetId, s)}
          />
        </div>
      </div>

      {assetKind === "tool" ? (
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/[0.06] bg-black/25 p-3">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-white/20 bg-neutral-900 text-primary focus:ring-primary/40"
            checked={m.tracked}
            onChange={(e) => setTracked(assetKind, assetId, e.target.checked)}
          />
          <span>
            <span className="text-sm text-neutral-200">On my tracked list</span>
            <span className="mt-0.5 block text-[11px] text-neutral-500">
              Included in your home ring (using+ vs tracked tools).
            </span>
          </span>
        </label>
      ) : null}

      <div className="border-t border-white/10 pt-4">
        <p className="text-xs font-medium text-neutral-500">Resources</p>
        <p className="mt-1 text-sm text-neutral-200">{resourceCount} linked</p>
      </div>

      {downloadUrl || repoUrl ? (
        <div className="space-y-2">
          {downloadUrl ? (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants({ variant: "default", size: "default" }),
                "flex w-full justify-center",
              )}
            >
              {downloadLabel}
            </a>
          ) : null}
          {repoUrl ? (
            <a
              href={repoUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "default" }),
                "flex w-full justify-center",
              )}
            >
              {repoHostLabel(repoUrl)}
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
