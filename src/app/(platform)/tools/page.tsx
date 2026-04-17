import { CatalogPage } from "@/components/catalog-page";
import { listPublishedToolsForUser } from "@/lib/catalog/repo";

export const dynamic = "force-dynamic";

export default async function ToolsPage() {
  const tools = await listPublishedToolsForUser();
  return <CatalogPage kind="tools" items={tools} />;
}
