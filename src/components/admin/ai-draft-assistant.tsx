"use client";

import { useState, useTransition } from "react";
import { FileUpload } from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import {
  generateDraftFromText,
  type GeneratedContent,
} from "@/app/(platform)/admin/generate/actions";
import { resolveCategoryIdFromLabel } from "@/lib/category-map";
import { cn } from "@/lib/utils";

export type DraftPayload = GeneratedContent & { categoryId: string };

type AiDraftAssistantProps = {
  onApply: (draft: DraftPayload) => void;
  /** Kept for API compatibility; generation output fills the shared form below. */
  variant?: "tool" | "skill";
  className?: string;
};

export function AiDraftAssistant({
  onApply,
  variant: _variant = "tool",
  className,
}: AiDraftAssistantProps) {
  void _variant;
  const [source, setSource] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(true);
  const [pending, startTransition] = useTransition();
  const [appliedSummary, setAppliedSummary] = useState<{
    name: string;
    tagline: string;
  } | null>(null);

  const run = () => {
    setError(null);
    setAppliedSummary(null);
    startTransition(async () => {
      try {
        const out = await generateDraftFromText(source);
        const payload: DraftPayload = {
          ...out,
          categoryId: resolveCategoryIdFromLabel(out.suggestedCategory),
        };
        onApply(payload);
        setAppliedSummary({ name: out.name, tagline: out.tagline });
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Generation failed");
      }
    });
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-neutral-950/70",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-neutral-100"
      >
        AI draft assistant
        <span className="text-neutral-500">{open ? "−" : "+"}</span>
      </button>
      {appliedSummary && !open ? (
        <div className="border-t border-white/[0.06] px-4 py-2 text-xs text-neutral-500">
          <span className="text-primary">Draft applied</span>
          {" — "}
          <span className="font-medium text-neutral-300">{appliedSummary.name}</span>
          {appliedSummary.tagline ? (
            <span className="text-neutral-500"> · {appliedSummary.tagline}</span>
          ) : null}
          <span className="text-neutral-600"> · Open the panel to generate again.</span>
        </div>
      ) : null}
      {open ? (
        <div className="space-y-3 border-t border-white/[0.06] p-4">
          <p className="text-sm text-neutral-400">
            Paste notes or upload a .md / .txt file, then <strong className="text-neutral-300">Generate draft</strong>{" "}
            — fields in the form below fill immediately (no separate preview). With{" "}
            <code className="rounded bg-white/10 px-1 text-xs">OPENAI_API_KEY</code> set,
            generation uses the model; otherwise a structured mock is returned.
          </p>
          <FileUpload
            onChange={(files) => {
              const f = files[0];
              if (!f) return;
              const lower = f.name.toLowerCase();
              if (
                lower.endsWith(".md") ||
                lower.endsWith(".txt") ||
                f.type === "text/plain" ||
                f.type === "text/markdown"
              ) {
                void f.text().then((text) => setSource((prev) => (prev ? `${prev}\n\n${text}` : text)));
              }
            }}
          />
          <textarea
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="# Paste markdown or plain text…"
            className="min-h-[180px] w-full resize-y rounded-xl border border-white/[0.08] bg-black/40 p-3 text-sm text-neutral-100 outline-none placeholder:text-neutral-600"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={run} disabled={pending}>
              {pending ? "Generating…" : "Generate draft"}
            </Button>
          </div>
          {error ? (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
