import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  tools as seedTools,
  skills as seedSkills,
  type Tool,
  type Skill,
} from "@/lib/mock-data";

/**
 * Source-of-truth loader for the tool/skill catalog.
 *
 * Strategy: Supabase is authoritative. When a row exists in DB it overrides the
 * seed entry with the same `id`/`slug`. Seeds that never migrated still render
 * alongside DB rows so the app keeps working during rollout. When Supabase is
 * not configured at all (local dev with no env), we fall back to seeds only.
 */

type ToolRow = {
  id: string;
  slug: string;
  name: string;
  category_id: string;
  tagline: string;
  description: string;
  body_markdown: string;
  install_steps: unknown;
  commands: unknown;
  featured: boolean;
  resources: unknown;
  adoption_count: number;
  cover_image: string | null;
  adoption_stages: unknown;
  content_status: "draft" | "published" | "archived";
  download_url: string | null;
  repo_url: string | null;
  external: boolean;
  created_at: string;
  updated_at: string;
};

type SkillRow = {
  id: string;
  slug: string;
  name: string;
  category_id: string;
  tagline: string;
  description: string;
  documentation: string;
  body_markdown: string;
  author: string;
  status: "active" | "beta";
  download_url: string;
  adoption_count: number;
  cover_image: string | null;
  adoption_stages: unknown;
  content_status: "draft" | "published" | "archived";
  repo_url: string | null;
  external: boolean;
  created_at: string;
  updated_at: string;
};

function asStringArray(x: unknown): string[] {
  return Array.isArray(x) ? x.filter((v): v is string => typeof v === "string") : [];
}

function rowToTool(r: ToolRow): Tool {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    categoryId: r.category_id,
    tagline: r.tagline,
    description: r.description,
    bodyMarkdown: r.body_markdown,
    installSteps: asStringArray(r.install_steps),
    commands: asStringArray(r.commands),
    featured: r.featured,
    resources: (Array.isArray(r.resources) ? r.resources : []) as Tool["resources"],
    adoptionCount: r.adoption_count,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    coverImage: r.cover_image ?? undefined,
    adoptionStages: (Array.isArray(r.adoption_stages)
      ? r.adoption_stages
      : undefined) as Tool["adoptionStages"],
    contentStatus: r.content_status,
    downloadUrl: r.download_url ?? undefined,
    repoUrl: r.repo_url ?? undefined,
    external: r.external,
  };
}

function rowToSkill(r: SkillRow): Skill {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    categoryId: r.category_id,
    tagline: r.tagline,
    description: r.description,
    documentation: r.documentation,
    bodyMarkdown: r.body_markdown,
    author: r.author,
    status: r.status,
    downloadUrl: r.download_url,
    adoptionCount: r.adoption_count,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    coverImage: r.cover_image ?? undefined,
    adoptionStages: (Array.isArray(r.adoption_stages)
      ? r.adoption_stages
      : undefined) as Skill["adoptionStages"],
    contentStatus: r.content_status,
    repoUrl: r.repo_url ?? undefined,
    external: r.external,
  };
}

export function toolToRow(tool: Tool): Record<string, unknown> {
  return {
    id: tool.id,
    slug: tool.slug,
    name: tool.name,
    category_id: tool.categoryId,
    tagline: tool.tagline,
    description: tool.description,
    body_markdown: tool.bodyMarkdown,
    install_steps: tool.installSteps,
    commands: tool.commands,
    featured: Boolean(tool.featured),
    resources: tool.resources,
    adoption_count: tool.adoptionCount,
    cover_image: tool.coverImage ?? null,
    adoption_stages: tool.adoptionStages ?? null,
    content_status: tool.contentStatus,
    download_url: tool.downloadUrl ?? null,
    repo_url: tool.repoUrl ?? null,
    external: Boolean(tool.external),
  };
}

export function skillToRow(skill: Skill): Record<string, unknown> {
  return {
    id: skill.id,
    slug: skill.slug,
    name: skill.name,
    category_id: skill.categoryId,
    tagline: skill.tagline,
    description: skill.description,
    documentation: skill.documentation,
    body_markdown: skill.bodyMarkdown,
    author: skill.author,
    status: skill.status,
    download_url: skill.downloadUrl,
    adoption_count: skill.adoptionCount,
    cover_image: skill.coverImage ?? null,
    adoption_stages: skill.adoptionStages ?? null,
    content_status: skill.contentStatus,
    repo_url: skill.repoUrl ?? null,
    external: Boolean(skill.external),
  };
}

/** Admin path: service-role read to bypass RLS for listing drafts/archived. */
async function adminReadTools(): Promise<Tool[]> {
  try {
    const admin = createSupabaseServiceClient();
    const { data, error } = await admin
      .from("tools")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error || !data) return [];
    return (data as ToolRow[]).map(rowToTool);
  } catch {
    return [];
  }
}

async function adminReadSkills(): Promise<Skill[]> {
  try {
    const admin = createSupabaseServiceClient();
    const { data, error } = await admin
      .from("skills")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error || !data) return [];
    return (data as SkillRow[]).map(rowToSkill);
  } catch {
    return [];
  }
}

/** Authenticated path: respects RLS (published-only for non-admins). */
async function userReadTools(): Promise<Tool[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("tools")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error || !data) return [];
    return (data as ToolRow[]).map(rowToTool);
  } catch {
    return [];
  }
}

async function userReadSkills(): Promise<Skill[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("skills")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error || !data) return [];
    return (data as SkillRow[]).map(rowToSkill);
  } catch {
    return [];
  }
}

function mergeBy<T extends { id: string; slug: string }>(db: T[], seed: T[]): T[] {
  const byId = new Map<string, T>();
  for (const s of seed) byId.set(s.id, s);
  for (const d of db) byId.set(d.id, d);
  const bySlug = new Map<string, T>();
  for (const v of byId.values()) bySlug.set(v.slug, v);
  return Array.from(bySlug.values());
}

export async function listToolsForAdmin(): Promise<Tool[]> {
  const db = await adminReadTools();
  return mergeBy<Tool>(db, seedTools);
}

export async function listSkillsForAdmin(): Promise<Skill[]> {
  const db = await adminReadSkills();
  return mergeBy<Skill>(db, seedSkills);
}

export async function listPublishedToolsForUser(): Promise<Tool[]> {
  const db = await userReadTools();
  const merged = mergeBy<Tool>(db, seedTools);
  return merged.filter((t) => t.contentStatus === "published");
}

export async function listPublishedSkillsForUser(): Promise<Skill[]> {
  const db = await userReadSkills();
  const merged = mergeBy<Skill>(db, seedSkills);
  return merged.filter((s) => s.contentStatus === "published");
}

export async function getToolBySlugAny(slug: string): Promise<Tool | undefined> {
  const db = await adminReadTools();
  const fromDb = db.find((t) => t.slug === slug);
  if (fromDb) return fromDb;
  return seedTools.find((t) => t.slug === slug);
}

export async function getSkillBySlugAny(slug: string): Promise<Skill | undefined> {
  const db = await adminReadSkills();
  const fromDb = db.find((s) => s.slug === slug);
  if (fromDb) return fromDb;
  return seedSkills.find((s) => s.slug === slug);
}

export async function getToolByIdAny(id: string): Promise<Tool | undefined> {
  const db = await adminReadTools();
  return db.find((t) => t.id === id) || seedTools.find((t) => t.id === id);
}

export async function getSkillByIdAny(id: string): Promise<Skill | undefined> {
  const db = await adminReadSkills();
  return db.find((s) => s.id === id) || seedSkills.find((s) => s.id === id);
}
