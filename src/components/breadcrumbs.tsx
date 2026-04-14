"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSkillBySlug, getToolBySlug, tools } from "@/lib/mock-data";
import { ChevronRight } from "lucide-react";

const segmentLabels: Record<string, string> = {
  tools: "Tools",
  skills: "Skills",
  profile: "Profile",
  admin: "Admin",
  announcements: "Announcements",
  categories: "Categories",
  resources: "Resources",
  edit: "Edit",
  generate: "Generate",
  new: "New",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { href: string; label: string }[] = [{ href: "/", label: "Home" }];

  let acc = "";
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    acc += `/${seg}`;
    let label = segmentLabels[seg] ?? seg;

    if (i > 0 && segments[i - 1] === "tools") {
      const t = getToolBySlug(seg) ?? tools.find((x) => x.id === seg);
      if (t) label = t.name;
    }
    if (i > 0 && segments[i - 1] === "skills") {
      const s = getSkillBySlug(seg);
      if (s) label = s.name;
    }
    if (seg.match(/^t_|^s_/) === null && segments[i - 1] === "admin" && seg === "tools") {
      label = "Tools";
    }

    crumbs.push({ href: acc, label });
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm">
      <ol className="flex flex-wrap items-center gap-1.5 text-neutral-500">
        {crumbs.map((c, idx) => {
          const isLast = idx === crumbs.length - 1;
          return (
            <li key={c.href} className="flex items-center gap-1.5">
              {idx > 0 ? (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-600" aria-hidden />
              ) : null}
              {isLast ? (
                <span className="font-medium text-neutral-100">{c.label}</span>
              ) : (
                <Link
                  href={c.href}
                  className="hover:text-neutral-300 transition-colors"
                >
                  {c.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
