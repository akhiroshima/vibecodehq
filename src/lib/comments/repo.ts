import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Comment } from "@/lib/mock-data";

type CommentRow = {
  id: string;
  entity_kind: "tool" | "skill";
  entity_id: string;
  parent_id: string | null;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  author: { display_name: string | null; username: string | null } | null;
};

function rowToComment(r: CommentRow): Comment {
  const author = r.author?.display_name || r.author?.username || "Member";
  return {
    id: r.id,
    author,
    body: r.body,
    createdAt: r.created_at,
  };
}

/**
 * Fetch comments for a given asset as a 1-level nested tree.
 */
export async function listCommentsForEntity(
  entityKind: "tool" | "skill",
  entityId: string,
): Promise<Comment[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("comments")
      .select(
        "id, entity_kind, entity_id, parent_id, author_id, body, created_at, updated_at, author:profiles!comments_author_id_fkey(display_name, username)",
      )
      .eq("entity_kind", entityKind)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false });
    if (error || !data) return [];

    const rows = data as unknown as CommentRow[];
    const topLevel: (Comment & { _id: string })[] = [];
    const repliesByParent = new Map<string, Comment[]>();

    for (const r of rows) {
      const c = rowToComment(r);
      if (r.parent_id) {
        const arr = repliesByParent.get(r.parent_id) ?? [];
        arr.push(c);
        repliesByParent.set(r.parent_id, arr);
      } else {
        topLevel.push({ ...c, _id: r.id });
      }
    }

    return topLevel.map((t) => ({
      ...t,
      replies: (repliesByParent.get(t._id) ?? []).slice().reverse(),
    }));
  } catch {
    return [];
  }
}
