export type Role = "designer" | "prime_mover";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  joinedAt: string;
  /** When set, member home shows studio in welcome line. */
  studioId?: string;
};

import type { AdoptionStage } from "@/lib/membership/types";

export type { AdoptionStage } from "@/lib/membership/types";

export type ContentStatus = "draft" | "published" | "archived";

export type ContentCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
};

/** First-class categories for tools and skills. */
export const categoryRecords: ContentCategory[] = [
  {
    id: "cat_ai",
    name: "AI Tools",
    slug: "ai-tools",
    description: "LLM-assisted workflows and packs",
  },
  {
    id: "cat_design",
    name: "Design Tools",
    slug: "design-tools",
    description: "Design ↔ engineering handoff",
  },
  {
    id: "cat_docs",
    name: "Documentation",
    slug: "documentation",
    description: "Docs, playbooks, and knowledge",
  },
  {
    id: "cat_review",
    name: "Review",
    slug: "review",
    description: "Critique and quality skills",
  },
];

export function getCategoryById(id: string): ContentCategory | undefined {
  return categoryRecords.find((c) => c.id === id);
}

export function getCategoryLabel(id: string): string {
  return getCategoryById(id)?.name ?? "Uncategorized";
}

/** Filter row: All + category display names. */
export const catalogCategoryFilterOptions = [
  "All",
  ...categoryRecords.map((c) => c.name),
];

export function adoptionStagePillClass(stage: AdoptionStage): string {
  const base =
    "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize";
  switch (stage) {
    case "aware":
      return `${base} border-neutral-500/40 bg-neutral-500/10 text-neutral-300`;
    case "exploring":
      return `${base} border-amber-500/35 bg-amber-500/10 text-amber-200`;
    case "using":
      return `${base} border-primary/40 bg-primary/10 text-primary`;
    case "expert":
      return `${base} border-emerald-500/40 bg-emerald-500/10 text-emerald-300`;
    default:
      return base;
  }
}

export type Tool = {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  tagline: string;
  description: string;
  bodyMarkdown: string;
  installSteps: string[];
  commands: string[];
  featured?: boolean;
  resources: Array<{ id: string; type: "video" | "pdf" | "link"; title: string; url: string }>;
  adoptionCount: number;
  createdAt: string;
  updatedAt: string;
  coverImage?: string;
  /** Optional ladder; last entry must be `expert`. Omitted → default four-step ladder in UI. */
  adoptionStages?: AdoptionStage[];
  contentStatus: ContentStatus;
};

export type Skill = {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  tagline: string;
  description: string;
  documentation: string;
  bodyMarkdown: string;
  author: string;
  status: "active" | "beta";
  downloadUrl: string;
  adoptionCount: number;
  createdAt: string;
  updatedAt: string;
  coverImage?: string;
  /** Optional ladder; last entry must be `expert`. Omitted → default four-step ladder in UI. */
  adoptionStages?: AdoptionStage[];
  contentStatus: ContentStatus;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  type: "new_tool" | "new_skill" | "update" | "tip";
  pinned?: boolean;
  createdAt: string;
  /** When set, announcement links to this catalog asset. */
  relatedAssetKind?: "tool" | "skill";
  relatedAssetId?: string;
};

export type Comment = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
  replies?: Comment[];
};

export type FeedItemType = "announcement" | "tool" | "skill";

export type FeedItem = {
  id: string;
  type: FeedItemType;
  title: string;
  excerpt: string;
  href: string;
  createdAt: string;
  subtype?: string;
  /** Cover image for tool/skill feed cards */
  coverImage?: string;
};

/** Tools included in the user’s personal adoption ring (chosen scope — not whole catalog). */
export const userTrackedToolIds = ["t_01", "t_02", "t_03"];

/** Studio / HQ headline metrics (mock). */
export const hqStudioMetrics = {
  /** % of members with ≥1 core tool at using+ this quarter (definition shown in UI). */
  membersAtUsingPlusPct: 72,
  /** Week-over-week lift in “using+” stage transitions (mock). */
  adoptionVelocityWoWPct: 12,
  /** Catalog items (tools + skills) updated or added in last 30 days. */
  shippedLast30Days: 4,
};

export const currentUser: AppUser = {
  id: "u_01",
  name: "Aditi Rao",
  email: "aditi.rao@studio.example",
  /** Switch to \`designer\` to hide admin nav in the shell. */
  role: "prime_mover",
  avatar: "AR",
  joinedAt: "2024-06-01T00:00:00.000Z",
  studioId: "studio_bangalore",
};

/** Per-tool adoption stage for current user (seed only — runtime uses membership store). */
export const userToolStages: Record<string, AdoptionStage> = {
  t_01: "using",
  t_02: "exploring",
  t_03: "aware",
};

export type SkillBadge = { skillId: string; earned: boolean };

export const userSkillBadges: SkillBadge[] = [
  { skillId: "s_01", earned: true },
  { skillId: "s_02", earned: false },
];

export const userSkillStages: Record<string, AdoptionStage> = {
  s_01: "expert",
  s_02: "exploring",
};

export type ActivityEntry = {
  id: string;
  label: string;
  at: string;
};

export const userActivityLog: ActivityEntry[] = [
  { id: "act_1", label: "Started using Cursor Studio Pack", at: "2026-04-12T10:00:00.000Z" },
  { id: "act_2", label: "Completed UX Review Accelerator walkthrough", at: "2026-04-10T14:30:00.000Z" },
  { id: "act_3", label: "Commented on Doc Lens", at: "2026-04-08T09:15:00.000Z" },
];

export type Studio = {
  id: string;
  name: string;
  city: string;
  designerCount: number;
};

/** Seven Asra studios — designer counts sum to HQ total. */
export const studioRecords: Studio[] = [
  { id: "studio_bangalore", name: "Bangalore", city: "Bangalore", designerCount: 38 },
  { id: "studio_delhi", name: "Delhi", city: "Delhi", designerCount: 37 },
  { id: "studio_chennai", name: "Chennai", city: "Chennai", designerCount: 36 },
  { id: "studio_mumbai", name: "Mumbai", city: "Mumbai", designerCount: 36 },
  { id: "studio_pune", name: "Pune", city: "Pune", designerCount: 36 },
  { id: "studio_hyderabad", name: "Hyderabad", city: "Hyderabad", designerCount: 34 },
  { id: "studio_kolkata", name: "Kolkata", city: "Kolkata", designerCount: 33 },
];

export const totalDesignerCount = studioRecords.reduce((acc, s) => acc + s.designerCount, 0);

export function getStudioById(id: string): Studio | undefined {
  return studioRecords.find((s) => s.id === id);
}

export type DesignerRecord = {
  name: string;
  studioId: string;
};

/** Sample designers with studio assignment (heatmap rows). */
export const designerRecords: DesignerRecord[] = [
  { name: "Aditi", studioId: "studio_bangalore" },
  { name: "Meera", studioId: "studio_delhi" },
  { name: "Nikhil", studioId: "studio_chennai" },
  { name: "Rahul", studioId: "studio_mumbai" },
  { name: "Sneha", studioId: "studio_pune" },
  { name: "Vikram", studioId: "studio_hyderabad" },
  { name: "Ananya", studioId: "studio_kolkata" },
  { name: "Kiran", studioId: "studio_bangalore" },
];

/** @deprecated Prefer `designerRecords` — names only for legacy call sites. */
export const designerRoster = designerRecords.map((d) => d.name);

/** Mock heatmap: designer name -> tool id -> stage */
export const adoptionHeatmap: Record<string, Record<string, AdoptionStage | "none">> = {};

for (let i = 0; i < designerRecords.length; i++) {
  const name = designerRecords[i].name;
  adoptionHeatmap[name] = {
    t_01: (["using", "expert", "exploring", "none", "using"][i % 5] ?? "none") as AdoptionStage | "none",
    t_02: (["exploring", "using", "aware", "none", "expert"][i % 5] ?? "none") as AdoptionStage | "none",
    t_03: (["aware", "none", "using", "exploring", "using"][i % 5] ?? "none") as AdoptionStage | "none",
  };
}

const USING_PLUS: Set<AdoptionStage | "none"> = new Set(["using", "expert"]);

/** Fraction of (designer × tool) cells in a studio at using+ (mock heatmap). */
export function studioUsingPlusFraction(studioId: string): number {
  const inStudio = designerRecords.filter((d) => d.studioId === studioId);
  if (inStudio.length === 0) return 0;
  let total = 0;
  let hit = 0;
  for (const { name } of inStudio) {
    const row = adoptionHeatmap[name];
    if (!row) continue;
    for (const stage of Object.values(row)) {
      total += 1;
      if (USING_PLUS.has(stage)) hit += 1;
    }
  }
  return total === 0 ? 0 : hit / total;
}

export type AdminActivity = { id: string; message: string; at: string };

export const adminRecentActivity: AdminActivity[] = [
  { id: "adm_1", message: "Nikhil adopted Spec Sync Companion", at: "2026-04-14T16:00:00.000Z" },
  { id: "adm_2", message: "New comment on Cursor Studio Pack", at: "2026-04-14T15:20:00.000Z" },
  { id: "adm_3", message: "Meera completed UX Review Accelerator", at: "2026-04-14T12:05:00.000Z" },
  { id: "adm_4", message: "Asra published Handoff Polisher update", at: "2026-04-13T18:40:00.000Z" },
  { id: "adm_5", message: "12 designers active on Doc Lens this week", at: "2026-04-13T09:00:00.000Z" },
];

export const statSparklines: Record<string, number[]> = {
  designers: [210, 218, 225, 230, 235, 242, 250],
  tools: [2, 2, 3, 3, 3, 3, 3],
  skills: [1, 2, 2, 2, 2, 2, 2],
  adoption: [52, 54, 56, 58, 59, 60, 61],
};

export const tools: Tool[] = [
  {
    id: "t_01",
    slug: "cursor-studio-pack",
    name: "Cursor Studio Pack",
    categoryId: "cat_ai",
    tagline: "Prompt packs and starter workflows for design-to-code tasks.",
    description:
      "A curated starter kit for design teams to move from explorations to production-ready assets faster.",
    bodyMarkdown: `## Why it exists

Design teams often stall between **Figma** and shipping because prompts and folder conventions are inconsistent. This pack encodes what Asra learned across dozens of studio projects.

![Placeholder cover](https://placehold.co/800x400/171717/737373?text=Cursor+Studio+Pack)

### What you get

- Opinionated prompt bundles for UI audits, handoff notes, and component scaffolding
- A verification script so everyone’s workspace matches the studio baseline

> Tip: Run \`studio-pack verify\` before every design critique so reviewers see the same context.

### Video

See the walkthrough in **Resources** for a full 15-minute onboarding.`,
    installSteps: [
      "Download the starter bundle from Asra resources.",
      "Import the snippets into your Cursor profile.",
      "Run the setup check script to verify folder conventions.",
    ],
    commands: ["npm i -g @asra/studio-pack", "studio-pack verify", "studio-pack init"],
    featured: true,
    resources: [
      { id: "r1", type: "video", title: "15-min onboarding walkthrough", url: "#" },
      { id: "r2", type: "pdf", title: "Quickstart checklist", url: "#" },
      { id: "r3", type: "link", title: "Troubleshooting FAQ", url: "#" },
    ],
    adoptionCount: 148,
    createdAt: "2026-04-10T09:00:00.000Z",
    updatedAt: "2026-04-12T11:00:00.000Z",
    coverImage: "https://placehold.co/1200x630/171717/86bc25?text=Cursor+Studio+Pack",
    contentStatus: "published",
  },
  {
    id: "t_02",
    slug: "figma-spec-sync",
    name: "Spec Sync Companion",
    categoryId: "cat_design",
    tagline: "Keeps implementation notes aligned to the latest handoff.",
    description:
      "Tracks component notes, spacing decisions, and release metadata between design and implementation docs.",
    bodyMarkdown: `## Overview

Spec Sync bridges the gap when your component library moves faster than the engineering ticket queue.

### Key flows

1. Map component groups once per project.
2. Enable auto-sync for release notes after each design publish.

\`\`\`bash
spec-sync login
spec-sync map --init
\`\`\``,
    installSteps: [
      "Connect your project workspace in the extension settings.",
      "Map your component groups once.",
      "Enable auto-sync for release notes.",
    ],
    commands: ["spec-sync login", "spec-sync map --init"],
    resources: [
      { id: "r4", type: "pdf", title: "Naming convention guide", url: "#" },
      { id: "r5", type: "link", title: "Component mapping examples", url: "#" },
    ],
    adoptionCount: 112,
    createdAt: "2026-04-05T14:00:00.000Z",
    updatedAt: "2026-04-11T08:00:00.000Z",
    coverImage: "https://placehold.co/1200x630/171717/a3a3a3?text=Spec+Sync",
    adoptionStages: ["aware", "exploring", "using", "expert"],
    contentStatus: "published",
  },
  {
    id: "t_03",
    slug: "doc-lens",
    name: "Doc Lens",
    categoryId: "cat_docs",
    tagline: "Turns messy process notes into structured playbooks.",
    description:
      "Ingests design process notes and generates clean, searchable, reusable documentation blocks.",
    bodyMarkdown: `## Doc Lens

Upload raw notes; get structured playbooks your PM can search.

- Templates for design reviews, decision logs, and retro summaries
- One-command publish to your team space`,
    installSteps: [
      "Upload source notes from your project folder.",
      "Choose documentation template.",
      "Publish to your team space.",
    ],
    commands: ["doc-lens login", "doc-lens publish ./notes"],
    resources: [{ id: "r6", type: "video", title: "Publishing flow demo", url: "#" }],
    adoptionCount: 93,
    createdAt: "2026-03-28T10:00:00.000Z",
    updatedAt: "2026-04-01T16:00:00.000Z",
    adoptionStages: ["aware", "using", "expert"],
    contentStatus: "published",
  },
  {
    id: "t_draft_01",
    slug: "design-linter-wip",
    name: "Design Linter (draft)",
    categoryId: "cat_design",
    tagline: "Automated consistency checks for design tokens and spacing.",
    description: "Work in progress — not visible in the member catalog until published.",
    bodyMarkdown: `## Draft

This tool is being authored in admin. Content will expand before publish.`,
    installSteps: ["TBD"],
    commands: [],
    resources: [],
    adoptionCount: 0,
    createdAt: "2026-04-14T10:00:00.000Z",
    updatedAt: "2026-04-14T10:00:00.000Z",
    contentStatus: "draft",
  },
];

export const skills: Skill[] = [
  {
    id: "s_01",
    slug: "ux-review-accelerator",
    name: "UX Review Accelerator",
    categoryId: "cat_review",
    tagline: "Structured review prompts for faster critique loops.",
    description:
      "A set of guided review prompts focused on hierarchy, spacing rhythm, accessibility, and intent clarity.",
    documentation:
      "Use this skill at the end of every design cycle. It generates a pass/fail style review output and action list.",
    bodyMarkdown: `## How to use

Run **UX Review Accelerator** after major layout passes. It walks through:

- Visual hierarchy and scan order
- Spacing rhythm vs. grid
- Accessibility checks (contrast, targets, labels)

### Output

You get a concise report with **pass/fail** per section and a prioritized action list.

![Review flow](https://placehold.co/720x360/171717/525252?text=Review+flow)`,
    author: "Asra",
    status: "active",
    downloadUrl: "#",
    adoptionCount: 134,
    createdAt: "2026-04-08T12:00:00.000Z",
    updatedAt: "2026-04-09T09:00:00.000Z",
    coverImage: "https://placehold.co/1200x630/171717/86bc25?text=UX+Review",
    adoptionStages: ["aware", "exploring", "using", "expert"],
    contentStatus: "published",
  },
  {
    id: "s_02",
    slug: "handoff-polisher",
    name: "Handoff Polisher",
    categoryId: "cat_docs",
    tagline: "Cleans final handoff notes for engineering handover.",
    description:
      "Enforces naming standards, adds implementation hints, and catches missing interaction states.",
    documentation:
      "Run this after component freeze. It creates a final handoff package with version tags.",
    bodyMarkdown: `## Handoff Polisher (beta)

Final pass before engineering build. Covers naming, motion notes, and empty states.

> Beta: report rough edges in comments on this page.`,
    author: "Asra",
    status: "beta",
    downloadUrl: "#",
    adoptionCount: 79,
    createdAt: "2026-04-03T15:30:00.000Z",
    updatedAt: "2026-04-07T11:00:00.000Z",
    adoptionStages: ["aware", "expert"],
    contentStatus: "published",
  },
  {
    id: "s_draft_01",
    slug: "accessibility-sprint-wip",
    name: "Accessibility Sprint Pack (draft)",
    categoryId: "cat_review",
    tagline: "Checklists and prompts for WCAG-aligned reviews.",
    description: "Draft skill — not in catalog until published.",
    documentation: "TBD",
    bodyMarkdown: `## Draft

Outline for a11y review workflows.`,
    author: "Asra",
    status: "beta",
    downloadUrl: "#",
    adoptionCount: 0,
    createdAt: "2026-04-14T12:00:00.000Z",
    updatedAt: "2026-04-14T12:00:00.000Z",
    contentStatus: "draft",
  },
];

export const announcements: Announcement[] = [
  {
    id: "a_01",
    title: "New Release: Cursor Studio Pack",
    body: "This week’s release includes new prompt bundles for landing pages and dashboard refactors.",
    type: "new_tool",
    pinned: true,
    createdAt: "2026-04-13T08:00:00.000Z",
    relatedAssetKind: "tool",
    relatedAssetId: "t_01",
  },
  {
    id: "a_02",
    title: "New Skill: UX Review Accelerator",
    body: "Use the new structured review flow for faster and more consistent quality checks.",
    type: "new_skill",
    createdAt: "2026-04-11T10:00:00.000Z",
    relatedAssetKind: "skill",
    relatedAssetId: "s_01",
  },
  {
    id: "a_03",
    title: "Process Tip: Document decisions same day",
    body: "Teams who record decision logs within 24h have significantly faster handoff quality.",
    type: "tip",
    createdAt: "2026-04-09T07:00:00.000Z",
  },
];

export const commentsByEntity: Record<string, Comment[]> = {
  "tool:cursor-studio-pack": [
    {
      id: "c_1",
      author: "Nikhil",
      body: "Can we get a variation for mobile-first design critiques?",
      createdAt: "2h ago",
      replies: [
        {
          id: "c_1_r1",
          author: "Asra",
          body: "Yes, shipping that in next week’s bundle.",
          createdAt: "45m ago",
        },
      ],
    },
  ],
  "skill:ux-review-accelerator": [
    {
      id: "c_2",
      author: "Meera",
      body: "This helped us cut review time by nearly 30%.",
      createdAt: "1d ago",
    },
  ],
};

/** @deprecated Use catalogCategoryFilterOptions */
export const categories = catalogCategoryFilterOptions;

export function getPublishedTools(): Tool[] {
  return tools.filter((t) => t.contentStatus === "published");
}

export function getPublishedSkills(): Skill[] {
  return skills.filter((s) => s.contentStatus === "published");
}

export function getDraftTools(): Tool[] {
  return tools.filter((t) => t.contentStatus === "draft");
}

export function getDraftSkills(): Skill[] {
  return skills.filter((s) => s.contentStatus === "draft");
}

export function getToolBySlug(slug: string) {
  return tools.find((tool) => tool.slug === slug);
}

export function getSkillBySlug(slug: string) {
  return skills.find((skill) => skill.slug === slug);
}

function announcementHref(a: Announcement): string {
  if (a.relatedAssetKind === "tool" && a.relatedAssetId) {
    const t = tools.find((x) => x.id === a.relatedAssetId);
    if (t) return `/tools/${t.slug}`;
  }
  if (a.relatedAssetKind === "skill" && a.relatedAssetId) {
    const s = skills.find((x) => x.id === a.relatedAssetId);
    if (s) return `/skills/${s.slug}`;
  }
  if (a.type === "new_tool") return "/tools/cursor-studio-pack";
  if (a.type === "new_skill") return "/skills/ux-review-accelerator";
  return "/tools";
}

export function buildFeedItems(): FeedItem[] {
  const fromAnnouncements: FeedItem[] = announcements.map((a) => {
    const id = `feed-a-${a.id}`;
    return {
      id,
      type: "announcement",
      title: a.title,
      excerpt: a.body,
      href: `${announcementHref(a)}#from-announcement`,
      createdAt: a.createdAt,
      subtype: a.type,
    };
  });

  const fromTools: FeedItem[] = getPublishedTools().map((t) => ({
    id: `feed-t-${t.id}`,
    type: "tool",
    title: t.name,
    excerpt: t.tagline,
    href: `/tools/${t.slug}`,
    createdAt: t.updatedAt,
    subtype: getCategoryLabel(t.categoryId),
    coverImage: t.coverImage,
  }));

  const fromSkills: FeedItem[] = getPublishedSkills().map((s) => ({
    id: `feed-s-${s.id}`,
    type: "skill",
    title: s.name,
    excerpt: s.tagline,
    href: `/skills/${s.slug}`,
    createdAt: s.updatedAt,
    subtype: s.status,
    coverImage: s.coverImage,
  }));

  return [...fromAnnouncements, ...fromTools, ...fromSkills].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function formatRelativeTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}
