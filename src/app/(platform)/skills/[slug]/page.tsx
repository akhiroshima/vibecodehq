import { SkillDetailPage } from "@/components/skill-detail-page";

export default async function SkillSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <SkillDetailPage slug={slug} />;
}
