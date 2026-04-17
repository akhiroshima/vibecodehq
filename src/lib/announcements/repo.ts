import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Announcement } from "@/lib/mock-data";

type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  type: Announcement["type"];
  pinned: boolean;
  related_asset_kind: "tool" | "skill" | null;
  related_asset_id: string | null;
  created_at: string;
  updated_at: string;
};

function rowToAnnouncement(r: AnnouncementRow): Announcement {
  return {
    id: r.id,
    title: r.title,
    body: r.body,
    type: r.type,
    pinned: r.pinned,
    createdAt: r.created_at,
    ...(r.related_asset_kind && r.related_asset_id
      ? { relatedAssetKind: r.related_asset_kind, relatedAssetId: r.related_asset_id }
      : {}),
  };
}

/** Read via user session (RLS allows all authenticated users). */
export async function listAnnouncements(): Promise<Announcement[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return (data as AnnouncementRow[]).map(rowToAnnouncement);
  } catch {
    return [];
  }
}

export async function listAnnouncementsForAdmin(): Promise<Announcement[]> {
  try {
    const admin = createSupabaseServiceClient();
    const { data, error } = await admin
      .from("announcements")
      .select("*")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return (data as AnnouncementRow[]).map(rowToAnnouncement);
  } catch {
    return [];
  }
}
