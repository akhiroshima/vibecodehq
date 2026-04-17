"use server";

import { generateText } from "ai";
import {
  FREE_DEFAULT_CHAIN,
  PaidModelBlockedError,
  assertModelIsFree,
  getOpenRouterProvider,
  isOpenRouterConfigured,
} from "@/lib/ai/openrouter";

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
    "This preview was generated locally because OPENROUTER_API_KEY is not set. Add it to .env.local to enable live drafts.",
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

const PROMPT_TEMPLATE = (input: string) =>
  `You are a technical writer for an internal design enablement platform (Asra — AI transformation HQ).
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

Return valid JSON only, no markdown fences.`;

function tryParseJson(text: string): GeneratedContent | null {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    const parsed = JSON.parse(cleaned) as Partial<GeneratedContent>;
    if (parsed.name && parsed.bodyMarkdown) return parsed as GeneratedContent;
  } catch {
    /* fall through */
  }
  return null;
}

export async function generateDraftFromText(
  input: string,
): Promise<GeneratedContent> {
  if (!isOpenRouterConfigured() || !input.trim()) {
    return {
      ...MOCK,
      description:
        MOCK.description + (input ? "" : " Paste content to replace this."),
    };
  }

  const provider = getOpenRouterProvider();
  if (!provider) return MOCK;

  const prompt = PROMPT_TEMPLATE(input);
  let lastError: unknown;
  let lastText = "";

  for (const modelId of FREE_DEFAULT_CHAIN) {
    try {
      await assertModelIsFree(modelId);
      const { text } = await generateText({
        model: provider(modelId),
        prompt,
      });
      lastText = text;
      const parsed = tryParseJson(text);
      if (parsed) return parsed;
      // Model returned non-JSON — continue to next model for a cleaner response.
    } catch (err) {
      lastError = err;
      if (err instanceof PaidModelBlockedError) throw err; // surface config errors immediately
      // Any other error (rate limit, provider outage) → try next model.
    }
  }

  if (lastText) {
    return {
      ...MOCK,
      description: "Model returned non-JSON across all free fallbacks. Raw excerpt below.",
      bodyMarkdown: lastText.slice(0, 4000),
    };
  }

  return {
    ...MOCK,
    description:
      "All free OpenRouter models failed (rate limited or offline). Try again in a minute." +
      (lastError instanceof Error ? ` Last error: ${lastError.message}` : ""),
  };
}
