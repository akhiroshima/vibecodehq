import type { UserAssetMembership } from "@/lib/membership/types";
import { isUsingPlus, membershipKey } from "@/lib/membership/types";

export function getMembership(
  memberships: UserAssetMembership[],
  assetKind: UserAssetMembership["assetKind"],
  assetId: string,
): UserAssetMembership | undefined {
  return memberships.find(
    (m) => m.assetKind === assetKind && m.assetId === assetId,
  );
}

/** Progress of tracked tools at using+ — denominator is tracked tools only. */
export function getTrackedAdoptionProgress(memberships: UserAssetMembership[]) {
  const trackedTools = memberships.filter(
    (m) => m.assetKind === "tool" && m.tracked,
  );
  const atUsingPlus = trackedTools.filter((m) => isUsingPlus(m.stage)).length;
  const denom = trackedTools.length;
  return {
    tracked: denom,
    atUsingPlus,
    pct: denom ? Math.round((atUsingPlus / denom) * 100) : 0,
  };
}

export function upsertMembership(
  list: UserAssetMembership[],
  patch: Partial<UserAssetMembership> &
    Pick<UserAssetMembership, "assetKind" | "assetId">,
): UserAssetMembership[] {
  const key = membershipKey(patch);
  const idx = list.findIndex((m) => membershipKey(m) === key);
  const prev = idx >= 0 ? list[idx] : undefined;
  const next: UserAssetMembership = {
    assetKind: patch.assetKind,
    assetId: patch.assetId,
    stage: patch.stage ?? prev?.stage ?? "aware",
    tracked: patch.tracked ?? prev?.tracked ?? false,
    installStepCompleted: patch.installStepCompleted ?? prev?.installStepCompleted,
  };
  if (idx === -1) return [...list, next];
  const copy = [...list];
  copy[idx] = next;
  return copy;
}
