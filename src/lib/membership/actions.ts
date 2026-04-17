"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdoptionStage, AssetKind } from "@/lib/membership/types";

export type MembershipActionResult = { ok: true } | { ok: false; message: string };

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase: null, userId: null } as const;
  return { supabase, userId: user.id } as const;
}

export async function upsertMembershipAction(input: {
  assetKind: AssetKind;
  assetId: string;
  stage?: AdoptionStage;
  tracked?: boolean;
}): Promise<MembershipActionResult> {
  const { supabase, userId } = await requireUser();
  if (!supabase || !userId) return { ok: false, message: "Not signed in." };

  const { assetKind, assetId, stage, tracked } = input;

  const { data: existing } = await supabase
    .from("user_memberships")
    .select("stage, tracked")
    .eq("user_id", userId)
    .eq("asset_kind", assetKind)
    .eq("asset_id", assetId)
    .maybeSingle();

  const nextStage: AdoptionStage = stage ?? (existing?.stage as AdoptionStage | undefined) ?? "aware";
  const nextTracked: boolean =
    typeof tracked === "boolean" ? tracked : Boolean(existing?.tracked);

  const { error } = await supabase.from("user_memberships").upsert(
    {
      user_id: userId,
      asset_kind: assetKind,
      asset_id: assetId,
      stage: nextStage,
      tracked: nextTracked,
    },
    { onConflict: "user_id,asset_kind,asset_id" },
  );
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
