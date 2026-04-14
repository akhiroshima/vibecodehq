import type { UserAssetMembership } from "@/lib/membership/types";
import { normalizeStage } from "@/lib/membership/types";

export type MembershipRepository = {
  load(): UserAssetMembership[];
  save(memberships: UserAssetMembership[]): void;
};

const STORAGE_KEY = "asra-membership-v1";

function parseStored(raw: string): UserAssetMembership[] {
  try {
    const parsed = JSON.parse(raw) as { memberships?: unknown[] };
    const list = (parsed.memberships ?? []) as UserAssetMembership[];
    return list.map((m) => ({
      assetKind: m.assetKind,
      assetId: m.assetId,
      stage: normalizeStage(String((m as UserAssetMembership).stage)),
      tracked: Boolean((m as UserAssetMembership).tracked),
      installStepCompleted: (m as UserAssetMembership).installStepCompleted,
    }));
  } catch {
    return [];
  }
}

export function createLocalStorageRepository(): MembershipRepository {
  return {
    load() {
      if (typeof window === "undefined") return [];
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return parseStored(raw);
    },
    save(memberships) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 1, memberships }),
      );
    },
  };
}
