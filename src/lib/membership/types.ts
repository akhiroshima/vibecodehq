export type AssetKind = "tool" | "skill";

/** Depth stages — single ladder (replaces legacy `proficient` = `expert`). */
export type AdoptionStage = "aware" | "exploring" | "using" | "expert";

export const ADOPTION_STAGES: AdoptionStage[] = [
  "aware",
  "exploring",
  "using",
  "expert",
];

export type UserAssetMembership = {
  assetKind: AssetKind;
  assetId: string;
  stage: AdoptionStage;
  /** Included in personal ring denominator when true. */
  tracked: boolean;
  installStepCompleted?: number[];
};

export function membershipKey(m: Pick<UserAssetMembership, "assetKind" | "assetId">) {
  return `${m.assetKind}:${m.assetId}` as const;
}

export function isUsingPlus(stage: AdoptionStage): boolean {
  return stage === "using" || stage === "expert";
}

export function defaultMembership(
  assetKind: AssetKind,
  assetId: string,
): UserAssetMembership {
  return {
    assetKind,
    assetId,
    stage: "aware",
    tracked: false,
  };
}

/** Migrate persisted JSON that may still use `proficient`. */
export function normalizeStage(raw: string): AdoptionStage {
  if (raw === "proficient") return "expert";
  if (
    raw === "aware" ||
    raw === "exploring" ||
    raw === "using" ||
    raw === "expert"
  ) {
    return raw;
  }
  return "aware";
}

/**
 * Admin-defined ladder for a tool/skill: 2+ stages, last must be `expert`.
 * Empty/undefined means use the full default ladder.
 */
export function resolveAdoptionStages(
  configured: AdoptionStage[] | undefined,
): AdoptionStage[] {
  if (!configured?.length) {
    return [...ADOPTION_STAGES];
  }
  const uniq = [...new Set(configured)];
  const withoutExpert = uniq.filter((s) => s !== "expert");
  return [...withoutExpert, "expert"];
}

/** If stored stage is not in the current ladder, fall back to first step. */
export function clampStageToAllowed(
  stage: AdoptionStage,
  allowed: AdoptionStage[],
): AdoptionStage {
  if (allowed.includes(stage)) return stage;
  return allowed[0] ?? "aware";
}
