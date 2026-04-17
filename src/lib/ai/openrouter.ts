import { createOpenAI, type OpenAIProvider } from "@ai-sdk/openai";

/**
 * OpenRouter integration — locked to free models by default.
 *
 * Safety layers (in order):
 *  1. Code-level allowlist: only model IDs in FREE_DEFAULT_CHAIN / FREE_EXTRA are accepted.
 *  2. Runtime pricing check: before the first call to a model, we hit
 *     https://openrouter.ai/api/v1/models and verify `pricing.prompt === "0"` and
 *     `pricing.completion === "0"`. Result is cached in memory for the process lifetime.
 *  3. Env override: OPENROUTER_ALLOW_PAID="true" disables both gates (off by default).
 *
 * References:
 *  - https://openrouter.ai/docs/quickstart
 *  - https://openrouter.ai/models?q=:free
 */

/** Preferred fallback order. First entry is the primary choice. */
export const FREE_DEFAULT_CHAIN = [
  "openai/gpt-oss-120b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-4-31b-it:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
] as const;

/** Additional IDs allowed if explicitly selected, but not in the default chain. */
export const FREE_EXTRA = new Set<string>([
  "openai/gpt-oss-20b:free",
  "google/gemma-4-26b-a4b-it:free",
  "google/gemma-3-27b-it:free",
  "google/gemma-3-12b-it:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "nvidia/nemotron-nano-12b-v2-vl:free",
  "nvidia/nemotron-nano-9b-v2:free",
  "z-ai/glm-4.5-air:free",
  "qwen/qwen3-coder:free",
  "minimax/minimax-m2.5:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
]);

const FREE_ALLOWLIST = new Set<string>([...FREE_DEFAULT_CHAIN, ...FREE_EXTRA]);

export function isOpenRouterConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

function paidAllowed(): boolean {
  return (process.env.OPENROUTER_ALLOW_PAID ?? "").toLowerCase() === "true";
}

export function isFreeModelAllowed(id: string): boolean {
  if (paidAllowed()) return true;
  if (!id.endsWith(":free")) return false;
  return FREE_ALLOWLIST.has(id);
}

export class PaidModelBlockedError extends Error {
  constructor(id: string) {
    super(
      `Model "${id}" is blocked. Only the free-tier allowlist is permitted. ` +
        `Set OPENROUTER_ALLOW_PAID=true to override.`,
    );
    this.name = "PaidModelBlockedError";
  }
}

// ---------- Runtime pricing check ----------

type ORModel = {
  id: string;
  pricing?: { prompt?: string; completion?: string; request?: string };
};

let pricingCache: Map<string, ORModel["pricing"]> | null = null;
let pricingCachePromise: Promise<Map<string, ORModel["pricing"]>> | null = null;

async function loadPricing(): Promise<Map<string, ORModel["pricing"]>> {
  if (pricingCache) return pricingCache;
  if (pricingCachePromise) return pricingCachePromise;
  pricingCachePromise = (async () => {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      // 1h cache is fine; pricing rarely changes.
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      throw new Error(`OpenRouter /models HTTP ${res.status}`);
    }
    const json = (await res.json()) as { data: ORModel[] };
    const map = new Map<string, ORModel["pricing"]>();
    for (const m of json.data) map.set(m.id, m.pricing);
    pricingCache = map;
    return map;
  })();
  return pricingCachePromise;
}

export async function assertModelIsFree(id: string): Promise<void> {
  if (paidAllowed()) return;
  if (!isFreeModelAllowed(id)) throw new PaidModelBlockedError(id);
  try {
    const pricing = (await loadPricing()).get(id);
    if (!pricing) return; // New model not yet surfaced — fall back to allowlist trust.
    const p = Number(pricing.prompt ?? "0");
    const c = Number(pricing.completion ?? "0");
    const r = Number(pricing.request ?? "0");
    if (p !== 0 || c !== 0 || r !== 0) {
      throw new PaidModelBlockedError(
        `${id} (prompt=${pricing.prompt}, completion=${pricing.completion})`,
      );
    }
  } catch (err) {
    if (err instanceof PaidModelBlockedError) throw err;
    // Network failure hitting /models — trust the allowlist and proceed.
  }
}

// ---------- Client factory ----------

export function getOpenRouterProvider(): OpenAIProvider | null {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;
  return createOpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    headers: {
      // OpenRouter uses these for attribution and ranking on their leaderboard.
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      "X-Title": "Asra (VibecodeHQ)",
    },
  });
}

export type FreeChainModel = (typeof FREE_DEFAULT_CHAIN)[number];
