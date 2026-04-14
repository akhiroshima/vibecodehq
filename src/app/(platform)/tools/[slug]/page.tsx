import { ToolDetailPage } from "@/components/tool-detail-page";

export default async function ToolSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ToolDetailPage slug={slug} />;
}
