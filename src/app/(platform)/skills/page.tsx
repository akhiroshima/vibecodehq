import { CatalogPage } from "@/components/catalog-page";
import { listPublishedSkillsForUser } from "@/lib/catalog/repo";

export const dynamic = "force-dynamic";

export default async function SkillsPage() {
  const skills = await listPublishedSkillsForUser();
  return <CatalogPage kind="skills" items={skills} />;
}
