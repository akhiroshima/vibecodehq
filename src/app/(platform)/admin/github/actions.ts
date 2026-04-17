"use server";

import { getSessionUser } from "@/lib/auth/get-current-user";

export type RepoPrefillPayload = {
  /** Pretty-cased repo name, e.g. "My Tool". */
  name: string;
  /** Short description (<=140 chars) from the repo metadata. */
  tagline: string;
  /** Full repo description (may equal tagline). */
  description: string;
  /** Markdown body — specific file if the URL points at one, otherwise repo README. */
  bodyMarkdown: string;
  /** Canonical HTML URL of the repo. */
  sourceUrl: string;
  /** GitHub login of the owner/org. */
  ownerLogin?: string;
  /** GitHub topics/tags. */
  topics?: string[];
  /** Homepage declared on the repo (optional). */
  homepage?: string | null;
};

export type RepoPrefillResult =
  | { ok: true; data: RepoPrefillPayload }
  | { ok: false; message: string };

type ParsedRef = {
  owner: string;
  repo: string;
  ref?: string;
  path?: string;
};

const MAX_BODY_CHARS = 200_000;

function parseGitHubUrl(input: string): ParsedRef | null {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "");
  if (host !== "github.com") return null;

  const parts = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
  if (parts.length < 2) return null;

  const owner = parts[0];
  const repoRaw = parts[1].replace(/\.git$/, "");
  if (!owner || !repoRaw) return null;

  const parsed: ParsedRef = { owner, repo: repoRaw };

  if (parts[2] === "blob" || parts[2] === "tree") {
    parsed.ref = parts[3];
    const pathParts = parts.slice(4);
    if (pathParts.length) parsed.path = pathParts.join("/");
  }
  return parsed;
}

function authHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function ghGet<T>(path: string): Promise<T | null> {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "VibecodeHQ-admin",
      ...authHeaders(),
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

function titleCase(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function b64decode(s: string): string {
  return Buffer.from(s.replace(/\n/g, ""), "base64").toString("utf8");
}

/**
 * Rewrite relative markdown image/link paths to absolute raw.githubusercontent.com URLs
 * so the blog preview can render them. Leaves absolute URLs and anchors intact.
 */
function rewriteRelativeUrls(
  body: string,
  owner: string,
  repo: string,
  branch: string,
  filePath: string | undefined,
): string {
  const rawBase = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/`;
  const baseDir = filePath
    ? filePath.split("/").slice(0, -1).concat("").join("/")
    : "";

  const resolve = (rel: string) => {
    if (
      /^(https?:)?\/\//i.test(rel) ||
      rel.startsWith("#") ||
      rel.startsWith("mailto:") ||
      rel.startsWith("data:")
    ) {
      return null;
    }
    const cleaned = rel.replace(/^\.\//, "").replace(/^\//, "");
    return `${rawBase}${baseDir}${cleaned}`;
  };

  return body.replace(
    /(!?)\[([^\]]*)\]\(([^)\s]+)(\s+"[^"]*")?\)/g,
    (match, bang: string, text: string, url: string, title: string = "") => {
      const abs = resolve(url);
      if (!abs) return match;
      return `${bang}[${text}](${abs}${title})`;
    },
  );
}

type RepoApi = {
  name: string;
  description: string | null;
  topics?: string[];
  default_branch: string;
  html_url: string;
  owner: { login: string };
  homepage?: string | null;
  private?: boolean;
};

type ContentApi = { content?: string; encoding?: string; path?: string };

export async function prefillFromRepoUrl(repoUrl: string): Promise<RepoPrefillResult> {
  const me = await getSessionUser();
  if (me.role !== "prime_mover") {
    return { ok: false, message: "Admins only." };
  }

  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) {
    return { ok: false, message: "URL must point at a GitHub repo or file (https://github.com/owner/repo[/blob/branch/path])." };
  }

  const repo = await ghGet<RepoApi>(`/repos/${parsed.owner}/${parsed.repo}`);
  if (!repo) {
    return {
      ok: false,
      message:
        "Repo not found, private, or GitHub rate-limited. Set GITHUB_TOKEN to authenticate (private + higher limits).",
    };
  }

  const branch = parsed.ref || repo.default_branch;
  let body = "";
  let bodyPath: string | undefined;

  if (parsed.path) {
    const refQS = `?ref=${encodeURIComponent(branch)}`;
    const file = await ghGet<ContentApi>(
      `/repos/${parsed.owner}/${parsed.repo}/contents/${parsed.path}${refQS}`,
    );
    if (file?.content && file.encoding === "base64") {
      body = b64decode(file.content);
      bodyPath = file.path || parsed.path;
    }
  }

  if (!body) {
    const refQS = `?ref=${encodeURIComponent(branch)}`;
    const readme = await ghGet<ContentApi>(
      `/repos/${parsed.owner}/${parsed.repo}/readme${refQS}`,
    );
    if (readme?.content && readme.encoding === "base64") {
      body = b64decode(readme.content);
      bodyPath = readme.path;
    }
  }

  if (body) {
    body = rewriteRelativeUrls(body, parsed.owner, parsed.repo, branch, bodyPath);
    if (body.length > MAX_BODY_CHARS) {
      body = `${body.slice(0, MAX_BODY_CHARS)}\n\n…truncated at ${MAX_BODY_CHARS} characters.`;
    }
  }

  const prettyName = titleCase(repo.name);
  const desc = repo.description ?? "";
  const tagline = desc.length > 140 ? `${desc.slice(0, 137).trimEnd()}…` : desc;

  return {
    ok: true,
    data: {
      name: prettyName,
      tagline,
      description: desc,
      bodyMarkdown: body,
      sourceUrl: repo.html_url,
      ownerLogin: repo.owner.login,
      topics: repo.topics,
      homepage: repo.homepage ?? null,
    },
  };
}
