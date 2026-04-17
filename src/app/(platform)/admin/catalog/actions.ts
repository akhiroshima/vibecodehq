"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/get-current-user";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  getSkillByIdAny,
  getToolByIdAny,
  skillToRow,
  toolToRow,
} from "@/lib/catalog/repo";
import type { Skill, Tool } from "@/lib/mock-data";
import { resolveAdoptionStages, type AdoptionStage } from "@/lib/membership/types";

type ToolResource = Tool["resources"][number];

type UpsertToolInput = {
  id?: string;
  slug?: string;
  name: string;
  tagline: string;
  categoryId: string;
  description: string;
  bodyMarkdown: string;
  installSteps: string[];
  commands: string[];
  resources: ToolResource[];
  coverImage?: string;
  adoptionStages?: AdoptionStage[];
  contentStatus: "draft" | "published" | "archived";
  downloadUrl?: string;
  repoUrl?: string;
  external: boolean;
};

type UpsertSkillInput = {
  id?: string;
  slug?: string;
  name: string;
  tagline: string;
  categoryId: string;
  description: string;
  documentation: string;
  bodyMarkdown: string;
  author: string;
  status: "active" | "beta";
  coverImage?: string;
  adoptionStages?: AdoptionStage[];
  contentStatus: "draft" | "published" | "archived";
  downloadUrl?: string;
  repoUrl?: string;
  external: boolean;
};

export type SaveResult =
  | { ok: true; id: string; slug: string }
  | { ok: false; message: string };

function slugify(name: string, fallback: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 64) || fallback
  );
}

function makeId(kind: "tool" | "skill", slug: string): string {
  const short = slug.replace(/[^a-z0-9-]/g, "").slice(0, 32) || "new";
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${kind}_${short}_${rand}`;
}

async function requireAdmin(): Promise<null | { message: string }> {
  if (!isSupabaseConfigured()) {
    return { message: "Supabase is not configured — cannot persist." };
  }
  const me = await getSessionUser();
  if (me.role !== "prime_mover") {
    return { message: "Admins only." };
  }
  return null;
}

export async function upsertTool(input: UpsertToolInput): Promise<SaveResult> {
  const guard = await requireAdmin();
  if (guard) return { ok: false, message: guard.message };

  const name = input.name.trim();
  if (!name) return { ok: false, message: "Name is required." };

  const slug = input.slug?.trim() || slugify(name, "new-tool");

  const existing = input.id ? await getToolByIdAny(input.id) : undefined;
  const id = existing?.id ?? input.id ?? makeId("tool", slug);

  const stages = input.adoptionStages
    ? resolveAdoptionStages(input.adoptionStages)
    : undefined;

  const tool: Tool = {
    id,
    slug,
    name,
    categoryId: input.categoryId,
    tagline: input.tagline,
    description: input.description,
    bodyMarkdown: input.bodyMarkdown,
    installSteps: input.installSteps.filter((s) => s.trim().length > 0),
    commands: input.commands.map((c) => c.trim()).filter(Boolean),
    featured: existing?.featured ?? false,
    resources: input.resources.filter((r) => (r.title || r.url).trim().length > 0),
    adoptionCount: existing?.adoptionCount ?? 0,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    coverImage: input.coverImage?.trim() || undefined,
    adoptionStages: stages,
    contentStatus: input.contentStatus,
    downloadUrl: input.downloadUrl?.trim() || undefined,
    repoUrl: input.repoUrl?.trim() || undefined,
    external: Boolean(input.external),
  };

  const admin = createSupabaseServiceClient();
  const { error } = await admin.from("tools").upsert(toolToRow(tool), { onConflict: "id" });
  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "A tool with that slug already exists." };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/tools");
  revalidatePath("/tools");
  revalidatePath(`/tools/${slug}`);
  revalidatePath(`/admin/tools/${id}/edit`);

  return { ok: true, id, slug };
}

export async function upsertSkill(input: UpsertSkillInput): Promise<SaveResult> {
  const guard = await requireAdmin();
  if (guard) return { ok: false, message: guard.message };

  const name = input.name.trim();
  if (!name) return { ok: false, message: "Name is required." };

  const slug = input.slug?.trim() || slugify(name, "new-skill");
  const existing = input.id ? await getSkillByIdAny(input.id) : undefined;
  const id = existing?.id ?? input.id ?? makeId("skill", slug);

  const stages = input.adoptionStages
    ? resolveAdoptionStages(input.adoptionStages)
    : undefined;

  const skill: Skill = {
    id,
    slug,
    name,
    categoryId: input.categoryId,
    tagline: input.tagline,
    description: input.description,
    documentation: input.documentation,
    bodyMarkdown: input.bodyMarkdown,
    author: input.author,
    status: input.status,
    downloadUrl: input.downloadUrl?.trim() || "",
    adoptionCount: existing?.adoptionCount ?? 0,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    coverImage: input.coverImage?.trim() || undefined,
    adoptionStages: stages,
    contentStatus: input.contentStatus,
    repoUrl: input.repoUrl?.trim() || undefined,
    external: Boolean(input.external),
  };

  const admin = createSupabaseServiceClient();
  const { error } = await admin.from("skills").upsert(skillToRow(skill), { onConflict: "id" });
  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "A skill with that slug already exists." };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/skills");
  revalidatePath("/skills");
  revalidatePath(`/skills/${slug}`);
  revalidatePath(`/admin/skills/${id}/edit`);

  return { ok: true, id, slug };
}

export async function archiveTool(id: string): Promise<SaveResult> {
  const guard = await requireAdmin();
  if (guard) return { ok: false, message: guard.message };

  const existing = await getToolByIdAny(id);
  if (!existing) return { ok: false, message: "Tool not found." };

  const admin = createSupabaseServiceClient();
  const payload = toolToRow({ ...existing, contentStatus: "archived" });
  const { error } = await admin.from("tools").upsert(payload, { onConflict: "id" });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/tools");
  revalidatePath("/tools");
  return { ok: true, id: existing.id, slug: existing.slug };
}

export async function archiveSkill(id: string): Promise<SaveResult> {
  const guard = await requireAdmin();
  if (guard) return { ok: false, message: guard.message };

  const existing = await getSkillByIdAny(id);
  if (!existing) return { ok: false, message: "Skill not found." };

  const admin = createSupabaseServiceClient();
  const payload = skillToRow({ ...existing, contentStatus: "archived" });
  const { error } = await admin.from("skills").upsert(payload, { onConflict: "id" });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/skills");
  revalidatePath("/skills");
  return { ok: true, id: existing.id, slug: existing.slug };
}
