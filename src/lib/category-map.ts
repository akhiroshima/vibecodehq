import { categoryRecords } from "@/lib/mock-data";

/** Map AI-suggested category label to a `categoryId`. */
export function resolveCategoryIdFromLabel(label: string): string {
  const t = label.trim();
  const c = categoryRecords.find((x) => x.name === t);
  return c?.id ?? "cat_docs";
}
