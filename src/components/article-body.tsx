import type { ImgHTMLAttributes } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

const markdownComponents = {
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="mt-8 scroll-mt-24 text-xl font-medium tracking-tight text-neutral-100 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="mt-6 text-lg font-medium text-neutral-100">{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mt-4 text-sm leading-relaxed text-neutral-300 first:mt-0">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-neutral-300">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-neutral-300">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="mt-4 border-l-2 border-white/15 pl-4 text-sm italic text-neutral-400">
      {children}
    </blockquote>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a
      href={href}
      className="font-medium text-primary underline-offset-4 hover:underline"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  ),
  img: (props: ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      alt={props.alt ?? ""}
      className="mt-4 max-h-80 w-full rounded-lg border border-white/10 object-cover"
    />
  ),
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="mt-4 overflow-x-auto rounded-lg border border-white/10 bg-black/50 p-4 text-sm text-neutral-200">
      {children}
    </pre>
  ),
  code: ({ className, children }: { className?: string; children?: React.ReactNode }) => {
    const isBlock = /language-/.test(className ?? "");
    if (isBlock) {
      return <code className={cn(className, "font-mono text-sm")}>{children}</code>;
    }
    return (
      <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.85em] text-neutral-200">
        {children}
      </code>
    );
  },
  hr: () => <hr className="my-8 border-white/10" />,
};

export function ArticleBody({ markdown }: { markdown: string }) {
  return (
    <div className="article-markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
