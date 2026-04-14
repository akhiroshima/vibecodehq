"use server";

import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

export type GeneratedContent = {
  name: string;
  tagline: string;
  description: string;
  bodyMarkdown: string;
  installSteps: string[];
  commands: string[];
  suggestedCategory: string;
  coverImagePrompt: string;
};

const MOCK: GeneratedContent = {
  name: "Generated Skill (mock)",
  tagline: "Auto-drafted from your source notes.",
  description:
    "This preview was generated locally because no API key is configured. Add OPENAI_API_KEY for live AI drafts.",
  bodyMarkdown:
    "## Overview\n\nConnect your source files and Asra can expand this into a full skill page.\n\n### Next steps\n\n- Review sections below\n- Add screenshots\n- Publish",
  installSteps: [
    "Paste your README or notes into the panel.",
    "Click Generate draft.",
    "Edit markdown, then publish when backend is ready.",
  ],
  commands: ["asra draft --from ./notes.md"],
  suggestedCategory: "Documentation",
  coverImagePrompt:
    "Minimal dark UI dashboard, teal accent, no text, studio lighting",
};

export async function generateDraftFromText(input: string): Promise<GeneratedContent> {
  const key = process.env.OPENAI_API_KEY;
  if (!key || !input.trim()) {
    return { ...MOCK, description: MOCK.description + (input ? "" : " Paste content to replace this.") };
  }

  const openai = createOpenAI({ apiKey: key });

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: `You are a technical writer for an internal design enablement platform (Asra — AI transformation HQ).
Given the following source material, produce a JSON object ONLY with these keys:
name, tagline, description (short), bodyMarkdown (markdown with sections ## Overview, ## Getting started, optional ### Notes),
installSteps (array of 3-5 short strings),
commands (array of CLI strings if applicable, else empty array),
suggestedCategory (one of: AI Tools, Design Tools, Documentation, Review),
coverImagePrompt (one sentence for a hero image, no text in image).

Source material:
---
${input.slice(0, 12000)}
---

Return valid JSON only, no markdown fences.`,
  });

  try {
    const parsed = JSON.parse(text) as GeneratedContent;
    if (parsed.name && parsed.bodyMarkdown) return parsed;
  } catch {
    /* fall through */
  }

  return {
    ...MOCK,
    description: "Model returned non-JSON. Showing raw excerpt in body.",
    bodyMarkdown: text.slice(0, 4000),
  };
}
