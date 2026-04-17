import { listAnnouncements } from "@/lib/announcements/repo";
import {
  listPublishedToolsForUser,
  listPublishedSkillsForUser,
} from "@/lib/catalog/repo";
import { getCategoriesMap } from "@/lib/categories/server";
import type { FeedItem, Tool, Skill, Announcement } from "@/lib/mock-data";

function announcementHref(a: Announcement, tools: Tool[], skills: Skill[]): string {
  if (a.relatedAssetKind === "tool" && a.relatedAssetId) {
    const t = tools.find((x) => x.id === a.relatedAssetId || x.slug === a.relatedAssetId);
    if (t) return `/tools/${t.slug}`;
  }
  if (a.relatedAssetKind === "skill" && a.relatedAssetId) {
    const s = skills.find((x) => x.id === a.relatedAssetId || x.slug === a.relatedAssetId);
    if (s) return `/skills/${s.slug}`;
  }
  if (a.type === "new_tool") return "/tools";
  if (a.type === "new_skill") return "/skills";
  return "/";
}

export async function buildFeedItemsServer(): Promise<FeedItem[]> {
  const [announcements, tools, skills, catMap] = await Promise.all([
    listAnnouncements(),
    listPublishedToolsForUser(),
    listPublishedSkillsForUser(),
    getCategoriesMap(),
  ]);

  const fromAnnouncements: FeedItem[] = announcements.map((a) => ({
    id: `feed-a-${a.id}`,
    type: "announcement",
    title: a.title,
    excerpt: a.body,
    href: `${announcementHref(a, tools, skills)}#from-announcement`,
    createdAt: a.createdAt,
    subtype: a.type,
  }));

  const fromTools: FeedItem[] = tools.map((t) => ({
    id: `feed-t-${t.id}`,
    type: "tool",
    title: t.name,
    excerpt: t.tagline,
    href: `/tools/${t.slug}`,
    createdAt: t.updatedAt,
    subtype: catMap.get(t.categoryId)?.name ?? "Uncategorized",
    coverImage: t.coverImage,
  }));

  const fromSkills: FeedItem[] = skills.map((s) => ({
    id: `feed-s-${s.id}`,
    type: "skill",
    title: s.name,
    excerpt: s.tagline,
    href: `/skills/${s.slug}`,
    createdAt: s.updatedAt,
    subtype: s.status,
    coverImage: s.coverImage,
  }));

  // Pinned announcements appear first, then combined chronological ordering.
  const pinned: FeedItem[] = [];
  const rest: FeedItem[] = [];
  for (const a of announcements) {
    const item = fromAnnouncements.find((f) => f.id === `feed-a-${a.id}`)!;
    if (a.pinned) pinned.push(item);
  }
  for (const item of [...fromAnnouncements, ...fromTools, ...fromSkills]) {
    if (item.type === "announcement" && pinned.includes(item)) continue;
    rest.push(item);
  }

  rest.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return [...pinned, ...rest];
}
