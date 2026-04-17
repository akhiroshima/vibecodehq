"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type {
  AssetKind,
  AdoptionStage,
  UserAssetMembership,
} from "@/lib/membership/types";
import {
  getMembership as selectMembership,
  getTrackedAdoptionProgress,
  upsertMembership,
} from "@/lib/membership/selectors";
import { upsertMembershipAction } from "@/lib/membership/actions";

type MembershipContextValue = {
  memberships: UserAssetMembership[];
  get: (assetKind: AssetKind, assetId: string) => UserAssetMembership | undefined;
  setStage: (assetKind: AssetKind, assetId: string, stage: AdoptionStage) => void;
  setTracked: (assetKind: AssetKind, assetId: string, tracked: boolean) => void;
  patch: (
    patch: Partial<UserAssetMembership> & Pick<UserAssetMembership, "assetKind" | "assetId">,
  ) => void;
  trackedProgress: ReturnType<typeof getTrackedAdoptionProgress>;
};

const MembershipContext = createContext<MembershipContextValue | null>(null);

export function MembershipProvider({
  initial,
  children,
}: {
  initial: UserAssetMembership[];
  children: React.ReactNode;
}) {
  const [memberships, setMemberships] = useState<UserAssetMembership[]>(initial);

  const persist = useCallback(
    (p: Partial<UserAssetMembership> & Pick<UserAssetMembership, "assetKind" | "assetId">) => {
      void upsertMembershipAction({
        assetKind: p.assetKind,
        assetId: p.assetId,
        stage: p.stage,
        tracked: p.tracked,
      }).catch(() => {
        /* server-side already logs; UI stays optimistic */
      });
    },
    [],
  );

  const patch = useCallback(
    (p: Partial<UserAssetMembership> & Pick<UserAssetMembership, "assetKind" | "assetId">) => {
      setMemberships((prev) => upsertMembership(prev, p));
      persist(p);
    },
    [persist],
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

  const get = useCallback(
    (assetKind: AssetKind, assetId: string) =>
      selectMembership(memberships, assetKind, assetId),
    [memberships],
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
