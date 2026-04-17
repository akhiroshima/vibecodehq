import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { studioRecords as seedStudios, type Studio } from "@/lib/mock-data";

type StudioRow = {
  id: string;
  name: string;
  city: string;
  designer_count: number;
};

function rowToStudio(r: StudioRow): Studio {
  return {
    id: r.id,
    name: r.name,
    city: r.city,
    designerCount: r.designer_count,
  };
}

export async function listStudios(): Promise<Studio[]> {
  if (!isSupabaseConfigured()) return seedStudios;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("studios")
      .select("*")
      .order("name", { ascending: true });
    if (error || !data) return seedStudios;
    return (data as StudioRow[]).map(rowToStudio);
  } catch {
    return seedStudios;
  }
}

export async function listStudiosForAdmin(): Promise<Studio[]> {
  try {
    const admin = createSupabaseServiceClient();
    const { data, error } = await admin
      .from("studios")
      .select("*")
      .order("name", { ascending: true });
    if (error || !data) return seedStudios;
    return (data as StudioRow[]).map(rowToStudio);
  } catch {
    return seedStudios;
  }
}
