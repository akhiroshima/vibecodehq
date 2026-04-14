import { CommentsSection } from "@/components/comments-section";
import { ArticleBody } from "@/components/article-body";
import { CodeBlock } from "@/components/ui/code-block";
import { getCategoryLabel, getToolBySlug, commentsByEntity } from "@/lib/mock-data";
import Link from "next/link";
import Image from "next/image";
import { AdoptionRail } from "@/components/adoption-rail";

export function ToolDetailPage({ slug }: { slug: string }) {
  const tool = getToolBySlug(slug);

  if (!tool) {
    return (
      <section className="rounded-2xl border border-dashed border-white/20 bg-black/35 p-10 text-center">
        <h1 className="text-2xl font-semibold text-neutral-100">Tool not found</h1>
        <p className="mt-2 text-sm text-neutral-400">This mock record does not exist yet.</p>
        <Link href="/tools" className="mt-4 inline-block text-sm text-primary">
          Back to tools
        </Link>
      </section>
    );
  }

  const comments = commentsByEntity[`tool:${tool.slug}`] ?? [];

  return (
    <section className="space-y-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0 space-y-8">
          <header className="space-y-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
              {getCategoryLabel(tool.categoryId)}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-100">
              {tool.name}
            </h1>
            <p className="text-sm leading-relaxed text-neutral-300">{tool.description}</p>
          </header>

          {tool.coverImage ? (
            <div className="relative aspect-[21/9] w-full overflow-hidden rounded-xl border border-white/[0.08] bg-neutral-900">
              <Image
                src={tool.coverImage}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width:1024px) 100vw, 896px"
                unoptimized
              />
            </div>
          ) : null}

          <ArticleBody markdown={tool.bodyMarkdown} />

          <section className="rounded-xl border border-white/[0.08] bg-neutral-950/70 p-6">
            <h2 className="text-xl font-medium text-neutral-100">Get started</h2>
            <ol className="mt-4 space-y-2">
              {tool.installSteps.map((step, index) => (
                <li
                  key={step}
                  className="rounded-lg border border-white/[0.08] bg-black/30 p-3 text-sm text-neutral-200"
                >
                  <span className="mr-2 font-semibold text-neutral-400">{index + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
            {tool.commands.length ? (
              <div className="mt-4">
                <CodeBlock
                  language="bash"
                  filename="install.sh"
                  code={tool.commands.join("\n")}
                />
              </div>
            ) : null}
          </section>

          <section className="rounded-xl border border-white/[0.08] bg-neutral-950/70 p-6">
            <h2 className="text-xl font-medium text-neutral-100">Resources</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tool.resources.map((resource) => (
                <a
                  key={resource.id}
                  href={resource.url}
                  className="rounded-lg border border-white/[0.08] bg-black/30 p-3 transition hover:border-white/20"
                >
                  <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                    {resource.type}
                  </p>
                  <p className="mt-2 text-sm text-neutral-200">{resource.title}</p>
                </a>
              ))}
            </div>
          </section>

          <CommentsSection initialComments={comments} />
        </div>

        <aside className="lg:sticky lg:top-6 lg:h-fit lg:self-start">
          <AdoptionRail
            assetKind="tool"
            assetId={tool.id}
            studioReach={tool.adoptionCount}
            resourceCount={tool.resources.length}
            adoptionStages={tool.adoptionStages}
          />
        </aside>
      </div>
    </section>
  );
}
