import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type MembershipRow = {
  user_id: string;
  asset_kind: "tool" | "skill";
  asset_id: string;
  stage: string;
  tracked: boolean;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  username: string | null;
  studio_id: string | null;
};

function isUsingPlus(stage: string) {
  return stage === "using" || stage === "expert";
}

export type HqMetrics = {
  memberCount: number;
  membersAtUsingPlusPct: number;
  shippedLast30Days: number;
  adoptionVelocityWoWPct: number;
};

export type StudioBreakdownRow = {
  studioId: string;
  name: string;
  city: string;
  memberCount: number;
  usingPlusPct: number;
};

export type ToolAdoptionRow = {
  toolId: string;
  name: string;
  totalMembers: number;
  usingPlus: number;
};

export type AdminDashboardData = {
  hq: HqMetrics;
  studios: StudioBreakdownRow[];
  toolAdoption: ToolAdoptionRow[];
  totalTools: number;
  totalSkills: number;
  draftTools: number;
  draftSkills: number;
  recentActivity: {
    id: string;
    message: string;
    at: string;
  }[];
};

const ZERO: AdminDashboardData = {
  hq: { memberCount: 0, membersAtUsingPlusPct: 0, shippedLast30Days: 0, adoptionVelocityWoWPct: 0 },
  studios: [],
  toolAdoption: [],
  totalTools: 0,
  totalSkills: 0,
  draftTools: 0,
  draftSkills: 0,
  recentActivity: [],
};

export async function loadAdminDashboardData(): Promise<AdminDashboardData> {
  if (!isSupabaseConfigured()) return ZERO;

  try {
    const admin = createSupabaseServiceClient();
    const now = Date.now();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();

    const [
      profilesRes,
      membershipsRes,
      studiosRes,
      toolsPubRes,
      skillsPubRes,
      toolsDraftRes,
      skillsDraftRes,
      toolsShippedRes,
      skillsShippedRes,
      commentsRes,
      recentStageWeekRes,
      recentStageTwoWeeksRes,
    ] = await Promise.all([
      admin.from("profiles").select("id, display_name, username, studio_id"),
      admin
        .from("user_memberships")
        .select("user_id, asset_kind, asset_id, stage, tracked"),
      admin.from("studios").select("id, name, city, designer_count"),
      admin.from("tools").select("id, name").eq("content_status", "published"),
      admin.from("skills").select("id, name").eq("content_status", "published"),
      admin.from("tools").select("id", { count: "exact", head: true }).eq("content_status", "draft"),
      admin.from("skills").select("id", { count: "exact", head: true }).eq("content_status", "draft"),
      admin
        .from("tools")
        .select("id", { count: "exact", head: true })
        .gte("updated_at", thirtyDaysAgo),
      admin
        .from("skills")
        .select("id", { count: "exact", head: true })
        .gte("updated_at", thirtyDaysAgo),
      admin
        .from("comments")
        .select("id, body, entity_kind, entity_id, created_at, author:profiles!comments_author_id_fkey(display_name, username)")
        .order("created_at", { ascending: false })
        .limit(8),
      admin
        .from("user_memberships")
        .select("user_id, asset_kind, asset_id, stage", { count: "exact", head: true })
        .gte("updated_at", sevenDaysAgo)
        .in("stage", ["using", "expert"]),
      admin
        .from("user_memberships")
        .select("user_id, asset_kind, asset_id, stage", { count: "exact", head: true })
        .gte("updated_at", fourteenDaysAgo)
        .lt("updated_at", sevenDaysAgo)
        .in("stage", ["using", "expert"]),
    ]);

    const profiles = (profilesRes.data ?? []) as ProfileRow[];
    const memberships = (membershipsRes.data ?? []) as MembershipRow[];
    const studios =
      (studiosRes.data ?? []) as { id: string; name: string; city: string; designer_count: number }[];
    const publishedTools = (toolsPubRes.data ?? []) as { id: string; name: string }[];
    const publishedSkills = (skillsPubRes.data ?? []) as { id: string; name: string }[];

    const memberCount = profiles.length;

    // Members with at least one tool/skill at using+
    const usingPlusUsers = new Set<string>();
    for (const m of memberships) {
      if (isUsingPlus(m.stage)) usingPlusUsers.add(m.user_id);
    }
    const membersAtUsingPlusPct =
      memberCount === 0 ? 0 : Math.round((usingPlusUsers.size / memberCount) * 100);

    const shippedLast30Days =
      (toolsShippedRes.count ?? 0) + (skillsShippedRes.count ?? 0);

    const weekCount = recentStageWeekRes.count ?? 0;
    const priorWeekCount = recentStageTwoWeeksRes.count ?? 0;
    const adoptionVelocityWoWPct =
      priorWeekCount === 0
        ? weekCount > 0
          ? 100
          : 0
        : Math.round(((weekCount - priorWeekCount) / priorWeekCount) * 100);

    // Per-studio breakdown: count real members + their using+ fraction
    const studioUsers = new Map<string, ProfileRow[]>();
    for (const p of profiles) {
      const key = p.studio_id ?? "__unassigned";
      const arr = studioUsers.get(key) ?? [];
      arr.push(p);
      studioUsers.set(key, arr);
    }

    const studioBreakdown: StudioBreakdownRow[] = studios.map((s) => {
      const users = studioUsers.get(s.id) ?? [];
      const ids = new Set(users.map((u) => u.id));
      const using = memberships.filter(
        (m) => ids.has(m.user_id) && isUsingPlus(m.stage),
      );
      const usingPlusPct =
        users.length === 0
          ? 0
          : Math.round((new Set(using.map((u) => u.user_id)).size / users.length) * 100);
      return {
        studioId: s.id,
        name: s.name,
        city: s.city,
        memberCount: users.length,
        usingPlusPct,
      };
    });

    // Per-tool adoption rollup: members at using+ per tool
    const toolAdoption: ToolAdoptionRow[] = publishedTools.map((t) => {
      const rows = memberships.filter((m) => m.asset_kind === "tool" && m.asset_id === t.id);
      const using = rows.filter((r) => isUsingPlus(r.stage)).length;
      return {
        toolId: t.id,
        name: t.name,
        totalMembers: rows.length,
        usingPlus: using,
      };
    });

    // Recent activity: comments are the most event-like signal right now.
    const recentActivity = (commentsRes.data as unknown as {
      id: string;
      body: string;
      entity_kind: "tool" | "skill";
      entity_id: string;
      created_at: string;
      author: { display_name: string | null; username: string | null } | null;
    }[] | null ?? []).map((c) => {
      const who = c.author?.display_name || c.author?.username || "Someone";
      const snippet = c.body.length > 60 ? `${c.body.slice(0, 60)}…` : c.body;
      return {
        id: c.id,
        message: `${who} commented on ${c.entity_kind}: ${snippet}`,
        at: c.created_at,
      };
    });

    return {
      hq: {
        memberCount,
        membersAtUsingPlusPct,
        shippedLast30Days,
        adoptionVelocityWoWPct,
      },
      studios: studioBreakdown,
      toolAdoption,
      totalTools: publishedTools.length,
      totalSkills: publishedSkills.length,
      draftTools: toolsDraftRes.count ?? 0,
      draftSkills: skillsDraftRes.count ?? 0,
      recentActivity,
    };
  } catch {
    return ZERO;
  }
}

export type HomeMetrics = {
  hq: HqMetrics;
  studioCity?: string;
  draftCount: number;
};

export async function loadHomeMetrics(userId?: string, studioId?: string): Promise<HomeMetrics> {
  if (!isSupabaseConfigured()) {
    return { hq: ZERO.hq, draftCount: 0 };
  }

  try {
    const admin = createSupabaseServiceClient();
    const now = Date.now();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();

    const [
      profilesCountRes,
      usingPlusUsersRes,
      shippedToolsRes,
      shippedSkillsRes,
      weekStageRes,
      priorWeekStageRes,
      draftToolsRes,
      draftSkillsRes,
      studioRes,
    ] = await Promise.all([
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin
        .from("user_memberships")
        .select("user_id")
        .in("stage", ["using", "expert"]),
      admin
        .from("tools")
        .select("id", { count: "exact", head: true })
        .gte("updated_at", thirtyDaysAgo)
        .eq("content_status", "published"),
      admin
        .from("skills")
        .select("id", { count: "exact", head: true })
        .gte("updated_at", thirtyDaysAgo)
        .eq("content_status", "published"),
      admin
        .from("user_memberships")
        .select("user_id", { count: "exact", head: true })
        .gte("updated_at", sevenDaysAgo)
        .in("stage", ["using", "expert"]),
      admin
        .from("user_memberships")
        .select("user_id", { count: "exact", head: true })
        .gte("updated_at", fourteenDaysAgo)
        .lt("updated_at", sevenDaysAgo)
        .in("stage", ["using", "expert"]),
      admin
        .from("tools")
        .select("id", { count: "exact", head: true })
        .eq("content_status", "draft"),
      admin
        .from("skills")
        .select("id", { count: "exact", head: true })
        .eq("content_status", "draft"),
      studioId
        ? admin.from("studios").select("city").eq("id", studioId).maybeSingle()
        : Promise.resolve({ data: null as { city: string } | null }),
    ]);

    const memberCount = profilesCountRes.count ?? 0;
    const usingPlusUsers = new Set(
      ((usingPlusUsersRes.data as { user_id: string }[] | null) ?? []).map((r) => r.user_id),
    );
    const membersAtUsingPlusPct =
      memberCount === 0 ? 0 : Math.round((usingPlusUsers.size / memberCount) * 100);

    const week = weekStageRes.count ?? 0;
    const priorWeek = priorWeekStageRes.count ?? 0;
    const adoptionVelocityWoWPct =
      priorWeek === 0
        ? week > 0
          ? 100
          : 0
        : Math.round(((week - priorWeek) / priorWeek) * 100);

    return {
      hq: {
        memberCount,
        membersAtUsingPlusPct,
        shippedLast30Days: (shippedToolsRes.count ?? 0) + (shippedSkillsRes.count ?? 0),
        adoptionVelocityWoWPct,
      },
      studioCity: studioRes.data?.city,
      draftCount: (draftToolsRes.count ?? 0) + (draftSkillsRes.count ?? 0),
    };
  } catch {
    void userId;
    return { hq: ZERO.hq, draftCount: 0 };
  }
}
