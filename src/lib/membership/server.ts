import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  normalizeStage,
  type AdoptionStage,
  type AssetKind,
  type UserAssetMembership,
} from "@/lib/membership/types";
import {
  buildSeedMemberships,
  ensureAllCatalogEntries,
} from "@/lib/membership/seed";

type Row = {
  asset_kind: AssetKind;
  asset_id: string;
  stage: string;
  tracked: boolean;
  install_steps_completed: number[] | null;
};

/**
 * Loads the current user's memberships from Supabase. When not signed-in or
 * Supabase is not configured, falls back to seed data so dev/demo UX still
 * works. DB rows take precedence over seeds.
 */
export async function loadMembershipsForCurrentUser(): Promise<UserAssetMembership[]> {
  if (!isSupabaseConfigured()) {
    return ensureAllCatalogEntries(buildSeedMemberships());
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return ensureAllCatalogEntries(buildSeedMemberships());

    const { data, error } = await supabase
      .from("user_memberships")
      .select("asset_kind, asset_id, stage, tracked, install_steps_completed")
      .eq("user_id", user.id);

    if (error || !data) {
      return ensureAllCatalogEntries(buildSeedMemberships());
    }

    const dbMemberships: UserAssetMembership[] = (data as Row[]).map((r) => ({
      assetKind: r.asset_kind,
      assetId: r.asset_id,
      stage: normalizeStage(r.stage) as AdoptionStage,
      tracked: Boolean(r.tracked),
      installStepCompleted: r.install_steps_completed ?? undefined,
    }));

    const byKey = new Map<string, UserAssetMembership>();
    for (const m of dbMemberships) {
      byKey.set(`${m.assetKind}:${m.assetId}`, m);
    }

    return ensureAllCatalogEntries(Array.from(byKey.values()));
  } catch {
    return ensureAllCatalogEntries(buildSeedMemberships());
  }
}
