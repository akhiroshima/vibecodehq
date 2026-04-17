"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { BlogMarkdownEditor } from "@/components/admin/blog-markdown-editor";
import {
  AiDraftAssistant,
  type DraftPayload,
} from "@/components/admin/ai-draft-assistant";
import {
  DistributionFields,
  emptyDistribution,
  type DistributionState,
} from "@/components/admin/distribution-fields";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type Skill } from "@/lib/mock-data";
import { useCategories } from "@/lib/categories/context";
import {
  ADOPTION_STAGES,
  resolveAdoptionStages,
  type AdoptionStage,
} from "@/lib/membership/types";
import { upsertSkill } from "@/app/(platform)/admin/catalog/actions";

const LADDER_PRESETS: Record<string, AdoptionStage[]> = {
  full: [...ADOPTION_STAGES],
  three: ["aware", "using", "expert"],
  two: ["aware", "expert"],
};

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 64) || "skill"
  );
}

function matchLadderKey(stages: AdoptionStage[] | undefined): keyof typeof LADDER_PRESETS {
  if (!stages?.length) return "full";
  const target = resolveAdoptionStages(stages);
  for (const k of Object.keys(LADDER_PRESETS) as (keyof typeof LADDER_PRESETS)[]) {
    const a = resolveAdoptionStages(LADDER_PRESETS[k]);
    if (a.length === target.length && a.every((s, i) => s === target[i])) return k;
  }
  return "full";
}

export function SkillEditForm({ initial }: { initial: Skill }) {
  const router = useRouter();
  const { categories } = useCategories();
  const formRef = useRef<HTMLFormElement>(null);
  const [flashDraft, setFlashDraft] = useState(false);

  const [name, setName] = useState(initial.name);
  const [tagline, setTagline] = useState(initial.tagline);
  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [description, setDescription] = useState(initial.description);
  const [documentation, setDocumentation] = useState(initial.documentation);
  const [bodyMarkdown, setBodyMarkdown] = useState(initial.bodyMarkdown);
  const [author, setAuthor] = useState(initial.author);
  const [status, setStatus] = useState<Skill["status"]>(initial.status);
  const [ladderKey, setLadderKey] = useState<keyof typeof LADDER_PRESETS>(() =>
    matchLadderKey(initial.adoptionStages),
  );
  const [coverImage, setCoverImage] = useState(initial.coverImage ?? "");
  const [contentStatus, setContentStatus] = useState<Skill["contentStatus"]>(
    initial.contentStatus,
  );
  const [distribution, setDistribution] = useState<DistributionState>(() => ({
    ...emptyDistribution(),
    downloadUrl: initial.downloadUrl && initial.downloadUrl !== "#" ? initial.downloadUrl : "",
    repoUrl: initial.repoUrl ?? "",
    external: Boolean(initial.external),
  }));
  const [saving, startSaving] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

  const adoptionStages = useMemo(
    () => resolveAdoptionStages(LADDER_PRESETS[ladderKey]),
    [ladderKey],
  );

  const applyDraft = (d: DraftPayload) => {
    setName(d.name);
    setTagline(d.tagline);
    setDescription(d.description);
    setDocumentation(d.description);
    setBodyMarkdown(d.bodyMarkdown);
    setCategoryId(d.categoryId);
    setCoverImage("");
    setFlashDraft(true);
    window.setTimeout(() => setFlashDraft(false), 2300);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    startSaving(async () => {
      const result = await upsertSkill({
        id: initial.id,
        slug: initial.slug || slugify(name),
        name,
        tagline,
        categoryId,
        description,
        documentation,
        bodyMarkdown,
        author,
        status,
        coverImage,
        adoptionStages,
        contentStatus,
        downloadUrl: distribution.downloadUrl,
        repoUrl: distribution.repoUrl,
        external: distribution.external,
      });
      if (!result.ok) {
        setSaveError(result.message);
        return;
      }
      router.push("/admin/skills");
      router.refresh();
    });
  };

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-2 rounded-2xl border border-white/[0.08] bg-neutral-950/70 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">Edit skill</h1>
          <p className="mt-1 text-sm text-neutral-400">{initial.name}</p>
        </div>
        <Link href="/admin/skills" className="text-sm text-neutral-400 hover:text-neutral-200">
          ← Back to skills
        </Link>
      </header>

      <AiDraftAssistant variant="skill" onApply={applyDraft} />

      <form ref={formRef} onSubmit={submit} className="space-y-10">
        <section
          className={cn(
            "rounded-2xl border border-white/[0.08] bg-neutral-950/70 p-6",
            flashDraft && "ai-draft-pulse",
          )}
        >
          <h2 className="text-lg font-medium text-neutral-100">Meta</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-neutral-300">
              Name
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
              />
            </label>
            <label className="block text-sm text-neutral-300">
              Tagline
              <input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
              />
            </label>
            <label className="block text-sm text-neutral-300">
              Author
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
              />
            </label>
            <label className="block text-sm text-neutral-300">
              Package status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Skill["status"])}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
              >
                <option value="active">Active</option>
                <option value="beta">Beta</option>
              </select>
            </label>
            <label className="block text-sm text-neutral-300 sm:col-span-2">
              Category
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-neutral-300 sm:col-span-2">
              Adoption ladder
              <select
                value={ladderKey}
                onChange={(e) =>
                  setLadderKey(e.target.value as keyof typeof LADDER_PRESETS)
                }
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
              >
                <option value="full">Four steps (aware → expert)</option>
                <option value="three">Three steps (aware, using, expert)</option>
                <option value="two">Two steps (aware, expert)</option>
              </select>
            </label>
          </div>
        </section>

        <section
          className={cn(
            "rounded-2xl border border-white/[0.08] bg-neutral-950/70 p-6",
            flashDraft && "ai-draft-pulse",
          )}
        >
          <h2 className="text-lg font-medium text-neutral-100">Body content</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Long-form markdown — preview matches the live skill page.
          </p>
          <div className="mt-4">
            <BlogMarkdownEditor value={bodyMarkdown} onChange={setBodyMarkdown} />
          </div>
        </section>

        <DistributionFields
          kind="skill"
          slug={name ? slugify(name) : initial.slug}
          value={distribution}
          onChange={setDistribution}
          onRepoPrefill={(p) => {
            if (p.name) setName(p.name);
            if (p.tagline) setTagline(p.tagline);
            if (p.description) {
              setDescription(p.description);
              setDocumentation(p.description);
            }
            if (p.bodyMarkdown) setBodyMarkdown(p.bodyMarkdown);
            setFlashDraft(true);
            window.setTimeout(() => setFlashDraft(false), 2300);
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              });
            });
          }}
          className={flashDraft ? "ai-draft-pulse" : undefined}
        />

        <section
          className={cn(
            "rounded-2xl border border-white/[0.08] bg-neutral-950/70 p-6",
            flashDraft && "ai-draft-pulse",
          )}
        >
          <h2 className="text-lg font-medium text-neutral-100">Publishing</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-neutral-300 sm:col-span-2">
              Short description (cards)
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 min-h-20 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
              />
            </label>
            <label className="block text-sm text-neutral-300 sm:col-span-2">
              Documentation blurb
              <textarea
                value={documentation}
                onChange={(e) => setDocumentation(e.target.value)}
                className="mt-1 min-h-24 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
              />
            </label>
            <label className="block text-sm text-neutral-300">
              Cover image URL
              <input
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://…"
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
              />
            </label>
            <label className="block text-sm text-neutral-300 sm:col-span-2">
              Catalog status
              <select
                value={contentStatus}
                onChange={(e) => setContentStatus(e.target.value as Skill["contentStatus"])}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>
          </div>
        </section>

        <div className="space-y-2">
          {saveError ? (
            <p className="text-sm text-red-400" role="alert">
              {saveError}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Link
              href="/admin/skills"
              className={cn(buttonVariants({ variant: "outline" }), "inline-flex")}
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </section>
  );
}
