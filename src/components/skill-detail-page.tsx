import Link from "next/link";
import Image from "next/image";
import { CommentsSection } from "@/components/comments-section";
import { ArticleBody } from "@/components/article-body";
import { getSkillBySlugAny } from "@/lib/catalog/repo";
import { getCategoryLabelAsync } from "@/lib/categories/server";
import { listCommentsForEntity } from "@/lib/comments/repo";
import { AdoptionRail } from "@/components/adoption-rail";
import { ExternalBadge } from "@/components/external-badge";
import { cn } from "@/lib/utils";

export async function SkillDetailPage({ slug }: { slug: string }) {
  const skill = await getSkillBySlugAny(slug);
  if (!skill) {
    return (
      <section className="rounded-2xl border border-dashed border-white/20 bg-black/35 p-10 text-center">
        <h1 className="text-2xl font-semibold text-neutral-100">Skill not found</h1>
        <p className="mt-2 text-sm text-neutral-400">This mock record does not exist yet.</p>
        <Link href="/skills" className="mt-4 inline-block text-sm text-primary">
          Back to skills
        </Link>
      </section>
    );
  }

  const categoryLabel = await getCategoryLabelAsync(skill.categoryId);
  const comments = await listCommentsForEntity("skill", skill.id);

  return (
    <section className="space-y-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0 space-y-8">
          <header className="space-y-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
              {categoryLabel}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-100">
              {skill.name}
            </h1>
            <p className="text-sm leading-relaxed text-neutral-300">{skill.description}</p>
            <div className="flex flex-wrap gap-2">
              <span
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium",
                  skill.status === "beta"
                    ? "border-amber-400/40 bg-amber-400/10 text-amber-400"
                    : "border-emerald-400/40 bg-emerald-400/10 text-emerald-400",
                )}
              >
                {skill.status === "beta" ? "Beta" : "Active"}
              </span>
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-neutral-400">
                By {skill.author}
              </span>
              {skill.external ? <ExternalBadge /> : null}
            </div>
          </header>

          {skill.coverImage ? (
            <div className="relative aspect-[21/9] w-full overflow-hidden rounded-xl border border-white/[0.08] bg-neutral-900">
              <Image
                src={skill.coverImage}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width:1024px) 100vw, 896px"
                unoptimized
              />
            </div>
          ) : null}

          <section className="rounded-xl border border-white/[0.08] bg-neutral-950/70 p-6">
            <h2 className="text-xl font-medium text-neutral-100">Documentation</h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-400">{skill.documentation}</p>
          </section>

          <ArticleBody markdown={skill.bodyMarkdown} />

          <CommentsSection
            entityKind="skill"
            entityId={skill.id}
            entitySlug={skill.slug}
            initialComments={comments}
          />
        </div>

        <aside className="lg:sticky lg:top-6 lg:h-fit lg:self-start">
          <AdoptionRail
            assetKind="skill"
            assetId={skill.id}
            studioReach={skill.adoptionCount}
            resourceCount={0}
            adoptionStages={skill.adoptionStages}
            downloadUrl={skill.downloadUrl !== "#" ? skill.downloadUrl : undefined}
            downloadLabel="Download skill package"
            repoUrl={skill.repoUrl || undefined}
          />
        </aside>
      </div>
    </section>
  );
}
