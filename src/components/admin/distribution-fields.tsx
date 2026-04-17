"use client";

import { useState, useTransition } from "react";
import { FileUpload } from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import {
  removeDistributionAsset,
  uploadDistributionAsset,
} from "@/app/(platform)/admin/assets/actions";
import {
  prefillFromRepoUrl,
  type RepoPrefillPayload,
} from "@/app/(platform)/admin/github/actions";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";

export type DistributionState = {
  /** Public URL of the uploaded or pasted download asset. */
  downloadUrl: string;
  /** Storage path (only set when uploaded, so we can delete it). */
  downloadPath?: string;
  /** Original filename, shown in the UI. */
  downloadName?: string;
  /** Size in bytes of the uploaded asset. */
  downloadSize?: number;
  /** Optional repository URL (e.g. GitHub). */
  repoUrl: string;
  /** True when this tool/skill is shared from outside Deloitte. */
  external: boolean;
};

export function emptyDistribution(): DistributionState {
  return { downloadUrl: "", repoUrl: "", external: false };
}

type Props = {
  kind: "tool" | "skill";
  slug?: string;
  value: DistributionState;
  onChange: (next: DistributionState) => void;
  /** Optional — when provided, shows a "Prefill from repo" button that fetches README + metadata. */
  onRepoPrefill?: (payload: RepoPrefillPayload) => void;
  className?: string;
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

const REPO_HOST_RE =
  /^https:\/\/(www\.)?(github\.com|gitlab\.com|bitbucket\.org)\/[\w.-]+\/[\w.-]+/i;

function validateRepoUrl(url: string): string | null {
  if (!url) return null;
  try {
    new URL(url);
  } catch {
    return "Enter a full URL (https://…).";
  }
  if (!REPO_HOST_RE.test(url)) {
    return "Repo URL should point at GitHub, GitLab, or Bitbucket.";
  }
  return null;
}

export function DistributionFields({
  kind,
  slug,
  value,
  onChange,
  onRepoPrefill,
  className,
}: Props) {
  const [pending, start] = useTransition();
  const [prefillPending, startPrefill] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [prefillError, setPrefillError] = useState<string | null>(null);
  const [prefillNote, setPrefillNote] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  const repoError = validateRepoUrl(value.repoUrl);
  const isGithub = /^https:\/\/(www\.)?github\.com\//i.test(value.repoUrl);
  const canPrefill = Boolean(onRepoPrefill) && isGithub && !repoError;

  const runPrefill = () => {
    setPrefillError(null);
    setPrefillNote(null);
    const url = value.repoUrl.trim();
    if (!url) return;
    startPrefill(async () => {
      const result = await prefillFromRepoUrl(url);
      if (!result.ok) {
        setPrefillError(result.message);
        return;
      }
      onRepoPrefill?.(result.data);
      setPrefillNote(
        `Filled from ${result.data.ownerLogin ?? "repo"}. Review before publishing.`,
      );
    });
  };

  const handleFile = (files: File[]) => {
    const file = files[0];
    if (!file) return;
    if (!configured) {
      setError(
        "Supabase isn't configured — paste a download URL below instead, or set NEXT_PUBLIC_SUPABASE_URL to enable hosting.",
      );
      return;
    }
    setError(null);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", kind);
    if (slug) fd.append("slug", slug);

    start(async () => {
      const result = await uploadDistributionAsset(fd);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onChange({
        ...value,
        downloadUrl: result.url,
        downloadPath: result.path,
        downloadName: result.name,
        downloadSize: result.size,
      });
    });
  };

  const clearDownload = () => {
    const path = value.downloadPath;
    onChange({
      ...value,
      downloadUrl: "",
      downloadPath: undefined,
      downloadName: undefined,
      downloadSize: undefined,
    });
    if (path) {
      start(async () => {
        await removeDistributionAsset(path);
      });
    }
  };

  return (
    <section
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-neutral-950/70 p-6",
        className,
      )}
    >
      <h2 className="text-lg font-medium text-neutral-100">Distribution</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Attach a downloadable file and/or point at a source repository. Either is optional — use
        whichever fits the {kind}.
      </p>

      <div className="mt-4 space-y-5">
        <div>
          <p className="text-sm font-medium text-neutral-200">Downloadable file</p>
          <p className="mt-1 text-xs text-neutral-500">
            Uploads to Supabase Storage → produces a stable public link. Up to 50 MB.
          </p>

          {value.downloadUrl ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-black/30 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-neutral-200">
                  {value.downloadName || value.downloadUrl}
                </p>
                <p className="truncate text-xs text-neutral-500">
                  {value.downloadSize
                    ? `${formatBytes(value.downloadSize)} · `
                    : ""}
                  <a
                    href={value.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 hover:text-neutral-300"
                  >
                    {value.downloadUrl}
                  </a>
                </p>
              </div>
              <div className="flex flex-none gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={clearDownload}
                >
                  {value.downloadPath ? "Remove & delete" : "Clear"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <FileUpload
                multiple={false}
                replaceOnChange
                accept={{ "*/*": [] }}
                inputAccept="*/*"
                hint="Pick any file. Typical: .zip, .fig, .sketch, .plugin, .py, .yaml, binaries."
                onChange={handleFile}
              />
              {pending ? (
                <p className="mt-2 text-xs text-neutral-500" aria-live="polite">
                  Uploading…
                </p>
              ) : null}
            </div>
          )}

          <label className="mt-3 block text-xs text-neutral-400">
            …or paste an existing download URL
            <input
              value={value.downloadPath ? "" : value.downloadUrl}
              disabled={Boolean(value.downloadPath)}
              onChange={(e) =>
                onChange({
                  ...value,
                  downloadUrl: e.target.value,
                  downloadPath: undefined,
                  downloadName: undefined,
                  downloadSize: undefined,
                })
              }
              placeholder="https://example.com/my-plugin.zip"
              className={cn(
                "mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm text-neutral-100 outline-none",
                value.downloadPath && "cursor-not-allowed opacity-40",
              )}
            />
            {value.downloadPath ? (
              <span className="mt-1 block text-[11px] text-neutral-600">
                Remove the uploaded file above to edit this manually.
              </span>
            ) : null}
          </label>
        </div>

        <div>
          <p className="text-sm font-medium text-neutral-200">Source repository</p>
          <p className="mt-1 text-xs text-neutral-500">
            GitHub, GitLab, or Bitbucket. Rendered as a &ldquo;View on GitHub&rdquo; link on the {kind} page.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={value.repoUrl}
              onChange={(e) => onChange({ ...value, repoUrl: e.target.value })}
              placeholder="https://github.com/org/repo"
              className="flex-1 rounded-lg border border-white/10 bg-black/30 p-2 text-sm text-neutral-100 outline-none"
            />
            {onRepoPrefill ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canPrefill || prefillPending}
                onClick={runPrefill}
                title={
                  isGithub
                    ? "Fetch name, tagline, description, and README from the repo"
                    : "Only GitHub URLs support automatic prefill"
                }
              >
                {prefillPending ? "Fetching…" : "Prefill from repo"}
              </Button>
            ) : null}
          </div>
          {repoError ? (
            <p className="mt-1 text-xs text-amber-400">{repoError}</p>
          ) : null}
          {onRepoPrefill && !isGithub && value.repoUrl && !repoError ? (
            <p className="mt-1 text-xs text-neutral-500">
              Automatic prefill is GitHub-only for now — you can still paste the URL to show the link.
            </p>
          ) : null}
          {prefillError ? (
            <p className="mt-1 text-xs text-red-400" role="alert">
              {prefillError}
            </p>
          ) : null}
          {prefillNote ? (
            <p className="mt-1 text-xs text-emerald-400" aria-live="polite">
              {prefillNote}
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-black/30 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-white/20 bg-neutral-900 text-primary focus:ring-primary/40"
              checked={value.external}
              onChange={(e) => onChange({ ...value, external: e.target.checked })}
            />
            <span>
              <span className="block text-sm text-neutral-200">
                This {kind} was not built in Deloitte
              </span>
              <span className="mt-0.5 block text-[11px] text-neutral-500">
                Shared from an external source so the community has visibility. We&rsquo;ll show an
                &ldquo;External resource&rdquo; badge on the {kind} page and in listings.
              </span>
            </span>
          </label>
        </div>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
