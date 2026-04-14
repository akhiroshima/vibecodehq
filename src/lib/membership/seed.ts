import type { AdoptionStage, UserAssetMembership } from "@/lib/membership/types";
import { defaultMembership, membershipKey } from "@/lib/membership/types";
import {
  getPublishedSkills,
  getPublishedTools,
  userSkillStages,
  userToolStages,
  userTrackedToolIds,
} from "@/lib/mock-data";

/** Former `userAdoptedToolIds` — merged into seed so “in use” bumps depth once. */
const LEGACY_ADOPTED_TOOL_IDS = ["t_01", "t_02"];

function mapLegacyStage(s: AdoptionStage | "proficient" | undefined): AdoptionStage {
  if (!s) return "aware";
  return s === "proficient" ? "expert" : s;
}

/**
 * Initial snapshot from mock-data for first hydration before localStorage exists.
 */
export function buildSeedMemberships(): UserAssetMembership[] {
  const map = new Map<string, UserAssetMembership>();

  for (const t of getPublishedTools()) {
    const stage = mapLegacyStage(userToolStages[t.id] as AdoptionStage | "proficient");
    let nextStage = stage;
    if (LEGACY_ADOPTED_TOOL_IDS.includes(t.id)) {
      if (nextStage === "aware" || nextStage === "exploring") {
        nextStage = "using";
      }
    }
    const m: UserAssetMembership = {
      assetKind: "tool",
      assetId: t.id,
      stage: nextStage,
      tracked: userTrackedToolIds.includes(t.id),
    };
    map.set(membershipKey(m), m);
  }

  for (const s of getPublishedSkills()) {
    const stage = mapLegacyStage(userSkillStages[s.id] as AdoptionStage | "proficient");
    const m: UserAssetMembership = {
      assetKind: "skill",
      assetId: s.id,
      stage,
      tracked: false,
    };
    map.set(membershipKey(m), m);
  }

  return Array.from(map.values());
}

export function mergeMemberships(
  existing: UserAssetMembership[],
  incoming: UserAssetMembership[],
): UserAssetMembership[] {
  const map = new Map<string, UserAssetMembership>();
  for (const m of existing) {
    map.set(membershipKey(m), m);
  }
  for (const m of incoming) {
    map.set(membershipKey(m), m);
  }
  return Array.from(map.values());
}

export function ensureAllCatalogEntries(
  memberships: UserAssetMembership[],
): UserAssetMembership[] {
  const map = new Map<string, UserAssetMembership>();
  for (const m of memberships) {
    map.set(membershipKey(m), m);
  }
  for (const t of getPublishedTools()) {
    const k = membershipKey({ assetKind: "tool", assetId: t.id });
    if (!map.has(k)) {
      map.set(k, defaultMembership("tool", t.id));
    }
  }
  for (const s of getPublishedSkills()) {
    const k = membershipKey({ assetKind: "skill", assetId: s.id });
    if (!map.has(k)) {
      map.set(k, defaultMembership("skill", s.id));
    }
  }
  return Array.from(map.values());
}
