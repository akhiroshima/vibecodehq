"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  startTransition,
  useState,
} from "react";
import type { AssetKind, AdoptionStage, UserAssetMembership } from "@/lib/membership/types";
import { createLocalStorageRepository } from "@/lib/membership/repository";
import {
  buildSeedMemberships,
  ensureAllCatalogEntries,
} from "@/lib/membership/seed";
import {
  getMembership as selectMembership,
  getTrackedAdoptionProgress,
  upsertMembership,
} from "@/lib/membership/selectors";

type MembershipContextValue = {
  memberships: UserAssetMembership[];
  get: (assetKind: AssetKind, assetId: string) => UserAssetMembership | undefined;
  setStage: (assetKind: AssetKind, assetId: string, stage: AdoptionStage) => void;
  setTracked: (assetKind: AssetKind, assetId: string, tracked: boolean) => void;
  patch: (patch: Partial<UserAssetMembership> & Pick<UserAssetMembership, "assetKind" | "assetId">) => void;
  trackedProgress: ReturnType<typeof getTrackedAdoptionProgress>;
};

const MembershipContext = createContext<MembershipContextValue | null>(null);

const repo = createLocalStorageRepository();

export function MembershipProvider({ children }: { children: React.ReactNode }) {
  const [memberships, setMemberships] = useState<UserAssetMembership[]>(() =>
    ensureAllCatalogEntries(buildSeedMemberships()),
  );

  useEffect(() => {
    const stored = repo.load();
    if (stored.length) {
      startTransition(() => {
        setMemberships(ensureAllCatalogEntries(stored));
      });
    }
  }, []);

  useEffect(() => {
    repo.save(memberships);
  }, [memberships]);

  const get = useCallback(
    (assetKind: AssetKind, assetId: string) =>
      selectMembership(memberships, assetKind, assetId),
    [memberships],
  );

  const patch = useCallback(
    (p: Partial<UserAssetMembership> & Pick<UserAssetMembership, "assetKind" | "assetId">) => {
      setMemberships((prev) => upsertMembership(prev, p));
    },
    [],
  );

  const setStage = useCallback(
    (assetKind: AssetKind, assetId: string, stage: AdoptionStage) => {
      patch({ assetKind, assetId, stage });
    },
    [patch],
  );

  const setTracked = useCallback(
    (assetKind: AssetKind, assetId: string, tracked: boolean) => {
      patch({ assetKind, assetId, tracked });
    },
    [patch],
  );

  const trackedProgress = useMemo(
    () => getTrackedAdoptionProgress(memberships),
    [memberships],
  );

  const value = useMemo<MembershipContextValue>(
    () => ({
      memberships,
      get,
      setStage,
      setTracked,
      patch,
      trackedProgress,
    }),
    [memberships, get, setStage, setTracked, patch, trackedProgress],
  );

  return (
    <MembershipContext.Provider value={value}>
      {children}
    </MembershipContext.Provider>
  );
}

export function useMembership() {
  const ctx = useContext(MembershipContext);
  if (!ctx) {
    throw new Error("useMembership must be used within MembershipProvider");
  }
  return ctx;
}
