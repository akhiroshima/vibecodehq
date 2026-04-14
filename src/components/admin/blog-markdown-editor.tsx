"use client";

import { useCallback, useRef } from "react";
import { ArticleBody } from "@/components/article-body";
import { cn } from "@/lib/utils";

type BlogMarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
};

export function BlogMarkdownEditor({
  value,
  onChange,
  id = "blog-body-md",
  className,
}: BlogMarkdownEditorProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);

  const apply = useCallback(
    (snippet: string) => {
      const el = taRef.current;
      if (!el) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const next = value.slice(0, start) + snippet + value.slice(end);
      onChange(next);
      const pos = start + snippet.length;
      requestAnimationFrame(() => {
        el.setSelectionRange(pos, pos);
        el.focus();
      });
    },
    [onChange, value],
  );

  const btn =
    "rounded-md border border-white/15 bg-black/40 px-2 py-1 text-[11px] font-medium text-neutral-300 transition hover:border-white/25 hover:text-neutral-100";

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap gap-1.5">
        <span className="w-full text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
          Insert
        </span>
        <button type="button" className={btn} onClick={() => apply("## ")}>
          Heading
        </button>
        <button type="button" className={btn} onClick={() => apply("**bold**")}>
          Bold
        </button>
        <button type="button" className={btn} onClick={() => apply("\n- \n")}>
          List
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => apply("\n```\n\n```\n")}
        >
          Code
        </button>
        <button type="button" className={btn} onClick={() => apply("\n> ")}>
          Quote
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => apply("![alt](https://)\n")}
        >
          Image
        </button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block min-h-0 flex-1 text-sm text-neutral-300">
          <span className="sr-only">Body markdown</span>
          <textarea
            ref={taRef}
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Write long-form content in Markdown…"
            className="min-h-[320px] w-full resize-y rounded-xl border border-white/[0.08] bg-black/40 p-4 font-mono text-sm text-neutral-100 outline-none placeholder:text-neutral-600"
            spellCheck
          />
        </label>
        <div className="min-h-[320px] overflow-auto rounded-xl border border-white/[0.08] bg-neutral-950/80 p-4">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
            Preview
          </p>
          {value.trim() ? (
            <ArticleBody markdown={value} />
          ) : (
            <p className="text-sm text-neutral-600">Preview updates as you type.</p>
          )}
        </div>
      </div>
    </div>
  );
}
