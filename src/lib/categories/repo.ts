import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  categoryRecords as seedCategories,
  type ContentCategory,
} from "@/lib/mock-data";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
};

function rowToCategory(r: CategoryRow): ContentCategory {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description ?? undefined,
  };
}

/** Reads with the caller's session (respects RLS). Falls back to seeds. */
export async function listCategories(): Promise<ContentCategory[]> {
  if (!isSupabaseConfigured()) return seedCategories;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error || !data) return seedCategories;
    return (data as CategoryRow[]).map(rowToCategory);
  } catch {
    return seedCategories;
  }
}

/** Service-role read for admin list (bypass RLS — used in admin pages only). */
export async function listCategoriesForAdmin(): Promise<ContentCategory[]> {
  try {
    const admin = createSupabaseServiceClient();
    const { data, error } = await admin
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error || !data) return seedCategories;
    return (data as CategoryRow[]).map(rowToCategory);
  } catch {
    return seedCategories;
  }
}
