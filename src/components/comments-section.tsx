"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Comment } from "@/lib/mock-data";

type CommentsSectionProps = {
  title?: string;
  initialComments: Comment[];
};

export function CommentsSection({
  title = "Questions and comments",
  initialComments,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [draft, setDraft] = useState("");

  const totalCount = useMemo(() => {
    return comments.reduce((acc, comment) => acc + 1 + (comment.replies?.length ?? 0), 0);
  }, [comments]);

  const addComment = () => {
    if (!draft.trim()) return;
    const next: Comment = {
      id: `draft_${Date.now()}`,
      author: "You",
      body: draft.trim(),
      createdAt: "just now",
    };
    setComments([next, ...comments]);
    setDraft("");
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-neutral-900/70 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-100">{title}</h3>
        <span className="text-xs text-neutral-400">{totalCount} messages</span>
      </div>

      <div className="mb-4 rounded-xl border border-white/10 bg-black/40 p-3">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Raise a question or share a tip..."
          className="min-h-20 w-full resize-y bg-transparent text-sm text-neutral-100 outline-none placeholder:text-neutral-500"
        />
        <div className="mt-3 flex justify-end">
          <Button onClick={addComment} size="sm" type="button">
            Post comment
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {comments.map((comment) => (
          <article key={comment.id} className="rounded-xl border border-white/10 bg-black/35 p-3">
            <header className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-100">{comment.author}</p>
              <p className="text-xs text-neutral-500">{comment.createdAt}</p>
            </header>
            <p className="text-sm text-neutral-300">{comment.body}</p>
            {comment.replies?.length ? (
              <div className="mt-3 space-y-2 border-l border-white/10 pl-3">
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="rounded-lg border border-white/10 bg-black/30 p-2">
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-xs font-medium text-neutral-200">{reply.author}</p>
                      <p className="text-[10px] text-neutral-500">{reply.createdAt}</p>
                    </div>
                    <p className="text-xs text-neutral-300">{reply.body}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
