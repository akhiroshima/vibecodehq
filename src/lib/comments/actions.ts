"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getSessionUser } from "@/lib/auth/get-current-user";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type CommentResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

export async function postCommentAction(input: {
  entityKind: "tool" | "skill";
  entityId: string;
  entitySlug?: string;
  body: string;
  parentId?: string | null;
}): Promise<CommentResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase is not configured." };
  }
  const body = input.body.trim();
  if (!body) return { ok: false, message: "Comment cannot be empty." };
  if (body.length > 4000) return { ok: false, message: "Comment is too long (max 4000)." };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in." };

  const { data, error } = await supabase
    .from("comments")
    .insert({
      entity_kind: input.entityKind,
      entity_id: input.entityId,
      parent_id: input.parentId ?? null,
      author_id: user.id,
      body,
    })
    .select("id")
    .single();

  if (error) return { ok: false, message: error.message };

  if (input.entitySlug) {
    revalidatePath(`/${input.entityKind}s/${input.entitySlug}`);
  }
  return { ok: true, id: data.id };
}

export async function deleteCommentAction(id: string): Promise<CommentResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase is not configured." };
  }
  const me = await getSessionUser();
  if (!me.id) return { ok: false, message: "Please sign in." };

  // RLS allows author or admin; use service client only when admin to keep checks simple.
  const supabase = me.role === "prime_mover"
    ? createSupabaseServiceClient()
    : await createSupabaseServerClient();

  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/tools", "layout");
  revalidatePath("/skills", "layout");
  return { ok: true, id };
}
