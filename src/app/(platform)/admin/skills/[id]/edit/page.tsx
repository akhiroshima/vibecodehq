"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { BlogMarkdownEditor } from "@/components/admin/blog-markdown-editor";
import {
  AiDraftAssistant,
  type DraftPayload,
} from "@/components/admin/ai-draft-assistant";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { categoryRecords, skills, type Skill } from "@/lib/mock-data";
import {
  ADOPTION_STAGES,
  resolveAdoptionStages,
  type AdoptionStage,
} from "@/lib/membership/types";

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

export default function AdminSkillEditPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [flashDraft, setFlashDraft] = useState(false);
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const seed = useMemo(() => skills.find((s) => s.id === id), [id]);

  const [name, setName] = useState(seed?.name ?? "");
  const [tagline, setTagline] = useState(seed?.tagline ?? "");
  const [categoryId, setCategoryId] = useState(seed?.categoryId ?? categoryRecords[0]?.id ?? "cat_review");
  const [description, setDescription] = useState(seed?.description ?? "");
  const [documentation, setDocumentation] = useState(seed?.documentation ?? "");
  const [bodyMarkdown, setBodyMarkdown] = useState(seed?.bodyMarkdown ?? "");
  const [author, setAuthor] = useState(seed?.author ?? "Asra");
  const [status, setStatus] = useState<"active" | "beta">(seed?.status ?? "active");
  const [ladderKey, setLadderKey] = useState<keyof typeof LADDER_PRESETS>(() =>
    matchLadderKey(seed?.adoptionStages),
  );
  const [coverImage, setCoverImage] = useState(seed?.coverImage ?? "");
  const [contentStatus, setContentStatus] = useState<Skill["contentStatus"]>(
    seed?.contentStatus ?? "draft",
  );
  const [downloadUrl, setDownloadUrl] = useState(seed?.downloadUrl ?? "");

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
    const slug = slugify(name);
    void slug;
    void adoptionStages;
    void downloadUrl;
    alert(`Updated skill (mock). Slug "${slug}". Connect API to persist.`);
    router.push("/admin/skills");
  };

  if (!seed) {
    return (
      <section className="space-y-6">
        <header className="rounded-2xl border border-white/[0.08] bg-neutral-950/70 p-6">
          <h1 className="text-2xl font-semibold text-neutral-100">Edit skill</h1>
          <p className="mt-1 text-sm text-amber-400">No skill found for ID: {id}</p>
          <Link href="/admin/skills" className="mt-4 inline-block text-sm text-primary hover:underline">
            ← Back to skills
          </Link>
        </header>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-2 rounded-2xl border border-white/[0.08] bg-neutral-950/70 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">Edit skill</h1>
          <p className="mt-1 text-sm text-neutral-400">{seed.name}</p>
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
                onChange={(e) => setStatus(e.target.value as "active" | "beta")}
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
                {categoryRecords.map((c) => (
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
              Download URL
              <input
                value={downloadUrl}
                onChange={(e) => setDownloadUrl(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
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
                onChange={(e) =>
                  setContentStatus(e.target.value as Skill["contentStatus"])
                }
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-sm outline-none"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Button type="submit">Save (mock)</Button>
          <Link
            href="/admin/skills"
            className={cn(buttonVariants({ variant: "outline" }), "inline-flex")}
          >
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
