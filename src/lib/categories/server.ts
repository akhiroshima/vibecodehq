import { cache } from "react";
import { listCategories } from "@/lib/categories/repo";
import type { ContentCategory } from "@/lib/mock-data";

/** Request-scoped cached snapshot of categories. */
export const getCategoriesMap = cache(async (): Promise<Map<string, ContentCategory>> => {
  const categories = await listCategories();
  return new Map(categories.map((c) => [c.id, c]));
});

export async function getCategoryLabelAsync(id: string): Promise<string> {
  const map = await getCategoriesMap();
  return map.get(id)?.name ?? "Uncategorized";
}
