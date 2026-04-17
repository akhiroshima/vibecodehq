import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/get-current-user";
import { getSkillByIdAny } from "@/lib/catalog/repo";
import { SkillEditForm } from "./skill-edit-form";

export default async function AdminSkillEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await getSessionUser();
  if (me.role !== "prime_mover") redirect("/");

  const { id } = await params;
  const skill = await getSkillByIdAny(id);

  if (!skill) {
    return (
      <section className="space-y-6">
        <header className="rounded-2xl border border-white/[0.08] bg-neutral-950/70 p-6">
          <h1 className="text-2xl font-semibold text-neutral-100">Edit skill</h1>
          <p className="mt-1 text-sm text-amber-400">No skill found for ID: {id}</p>
          <Link
            href="/admin/skills"
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            ← Back to skills
          </Link>
        </header>
      </section>
    );
  }

  return <SkillEditForm initial={skill} />;
}
