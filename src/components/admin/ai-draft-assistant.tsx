"use client";

import { useState, useTransition } from "react";
import { FileUpload } from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import {
  generateDraftFromText,
  type GeneratedContent,
} from "@/app/(platform)/admin/generate/actions";
import { extractTextFromUploads } from "@/lib/ai/file-extract";
import { resolveCategoryIdFromLabel } from "@/lib/category-map";
import { cn } from "@/lib/utils";

export type DraftPayload = GeneratedContent & { categoryId: string };

type AiDraftAssistantProps = {
  onApply: (draft: DraftPayload) => void;
  /** Kept for API compatibility; generation output fills the shared form below. */
  variant?: "tool" | "skill";
  className?: string;
};

type ExtractReport = {
  perFile: Array<{ name: string; bytes: number; chars: number; note?: string }>;
  skipped: Array<{ name: string; reason: string }>;
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

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
  const [uploading, startUpload] = useTransition();
  const [report, setReport] = useState<ExtractReport | null>(null);
  const [appliedSummary, setAppliedSummary] = useState<{
    name: string;
    tagline: string;
  } | null>(null);

  const handleFiles = (files: File[]) => {
    if (!files.length) return;
    setError(null);
    setReport(null);

    const fd = new FormData();
    for (const f of files) fd.append("files", f);

    startUpload(async () => {
      try {
        const result = await extractTextFromUploads(fd);
        if (result.text) {
          setSource((prev) => (prev ? `${prev}\n\n${result.text}` : result.text));
        }
        setReport({ perFile: result.perFile, skipped: result.skipped });
        if (!result.text && !result.perFile.length) {
          setError(
            "No text could be extracted. Supported: PDF, DOCX, Markdown, TXT, HTML, CSV, JSON, ZIP archives of the above.",
          );
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      }
    });
  };

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
            Paste notes, or drop one or more files (PDF, DOCX, Markdown, TXT, HTML, CSV, JSON, or a
            ZIP of any of these). Then click{" "}
            <strong className="text-neutral-300">Generate draft</strong> — the form below fills in
            place. With{" "}
            <code className="rounded bg-white/10 px-1 text-xs">OPENROUTER_API_KEY</code> set,
            generation uses a free model; otherwise a structured mock is returned.
          </p>
          <FileUpload
            multiple
            replaceOnChange
            hint="Up to 20 MB per file. Zips are expanded — images, audio, video, and Office spreadsheets/slides are skipped."
            onChange={handleFiles}
          />
          {uploading ? (
            <p className="text-xs text-neutral-500" aria-live="polite">
              Extracting text…
            </p>
          ) : null}
          {report ? (
            <div className="space-y-1 rounded-xl border border-white/[0.06] bg-black/30 p-3 text-xs">
              {report.perFile.length > 0 ? (
                <>
                  <p className="font-medium text-neutral-300">
                    Imported {report.perFile.length} file{report.perFile.length === 1 ? "" : "s"}
                  </p>
                  <ul className="space-y-0.5 text-neutral-500">
                    {report.perFile.map((f) => (
                      <li key={f.name} className="truncate">
                        <span className="text-neutral-300">{f.name}</span>
                        <span className="text-neutral-600">
                          {" "}
                          · {formatBytes(f.bytes)}
                          {f.chars ? ` · ${f.chars.toLocaleString()} chars` : ""}
                          {f.note ? ` · ${f.note}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
              {report.skipped.length > 0 ? (
                <>
                  <p className="mt-2 font-medium text-amber-300/80">
                    Skipped {report.skipped.length}
                  </p>
                  <ul className="space-y-0.5 text-neutral-500">
                    {report.skipped.map((s, i) => (
                      <li key={`${s.name}-${i}`} className="truncate">
                        <span className="text-neutral-400">{s.name}</span>
                        <span className="text-neutral-600"> · {s.reason}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          ) : null}
          <textarea
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="# Paste markdown or plain text, or drop files above…"
            className="min-h-[180px] w-full resize-y rounded-xl border border-white/[0.08] bg-black/40 p-3 text-sm text-neutral-100 outline-none placeholder:text-neutral-600"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={run} disabled={pending || uploading}>
              {pending ? "Generating…" : "Generate draft"}
            </Button>
            {source ? (
              <button
                type="button"
                onClick={() => {
                  setSource("");
                  setReport(null);
                }}
                className="text-xs text-neutral-500 hover:text-neutral-300"
              >
                Clear
              </button>
            ) : null}
            <span className="ml-auto text-xs text-neutral-600">
              {source ? `${source.length.toLocaleString()} chars` : ""}
            </span>
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
