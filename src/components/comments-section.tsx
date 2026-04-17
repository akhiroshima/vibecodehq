"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { postCommentAction } from "@/lib/comments/actions";
import { formatRelativeTime } from "@/lib/mock-data";
import type { Comment } from "@/lib/mock-data";

type CommentsSectionProps = {
  title?: string;
  entityKind: "tool" | "skill";
  entityId: string;
  entitySlug: string;
  initialComments: Comment[];
};

function CommentTime({ at }: { at: string }) {
  if (!at) return null;
  if (at === "just now" || at === "moments ago") {
    return <span>{at}</span>;
  }
  const formatted = formatRelativeTime(at);
  return <time dateTime={at}>{formatted}</time>;
}

export function CommentsSection({
  title = "Questions and comments",
  entityKind,
  entityId,
  entitySlug,
  initialComments,
}: CommentsSectionProps) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [draft, setDraft] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const totalCount = useMemo(() => {
    return comments.reduce((acc, comment) => acc + 1 + (comment.replies?.length ?? 0), 0);
  }, [comments]);

  const addComment = () => {
    if (!draft.trim() || pending) return;
    setError(null);
    const optimistic: Comment = {
      id: `temp_${Date.now()}`,
      author: "You",
      body: draft.trim(),
      createdAt: "just now",
    };
    setComments((prev) => [optimistic, ...prev]);
    const text = draft.trim();
    setDraft("");
    start(async () => {
      const r = await postCommentAction({
        entityKind,
        entityId,
        entitySlug,
        body: text,
      });
      if (!r.ok) {
        setError(r.message);
        setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
        return;
      }
      router.refresh();
    });
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-neutral-900/70 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-100">{title}</h3>
        <span className="text-xs text-neutral-400">
          {totalCount} {totalCount === 1 ? "message" : "messages"}
        </span>
      </div>

      <div className="mb-4 rounded-xl border border-white/10 bg-black/40 p-3">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Raise a question or share a tip..."
          className="min-h-20 w-full resize-y bg-transparent text-sm text-neutral-100 outline-none placeholder:text-neutral-500"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-neutral-500">Visible to everyone on Asra.</p>
          <Button onClick={addComment} size="sm" type="button" disabled={pending || !draft.trim()}>
            {pending ? "Posting…" : "Post comment"}
          </Button>
        </div>
        {error ? (
          <p className="mt-2 text-xs text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        {comments.map((comment) => (
          <article key={comment.id} className="rounded-xl border border-white/10 bg-black/35 p-3">
            <header className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-100">{comment.author}</p>
              <p className="text-xs text-neutral-500">
                <CommentTime at={comment.createdAt} />
              </p>
            </header>
            <p className="whitespace-pre-wrap text-sm text-neutral-300">{comment.body}</p>
            {comment.replies?.length ? (
              <div className="mt-3 space-y-2 border-l border-white/10 pl-3">
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="rounded-lg border border-white/10 bg-black/30 p-2">
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-xs font-medium text-neutral-200">{reply.author}</p>
                      <p className="text-[10px] text-neutral-500">
                        <CommentTime at={reply.createdAt} />
                      </p>
                    </div>
                    <p className="whitespace-pre-wrap text-xs text-neutral-300">{reply.body}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </article>
        ))}
        {comments.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/15 bg-neutral-950/40 p-6 text-center text-sm text-neutral-500">
            No comments yet. Be the first to share a note.
          </p>
        ) : null}
      </div>
    </section>
  );
}
