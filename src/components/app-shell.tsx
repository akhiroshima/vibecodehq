"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { FloatingNav } from "@/components/ui/floating-navbar";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  BookOpen,
  Home,
  LayoutGrid,
  Megaphone,
  Package,
  Sparkles,
  Tags,
  Wrench,
} from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { cn } from "@/lib/utils";
import { currentUser } from "@/lib/mock-data";
import { motion } from "motion/react";
import Link from "next/link";

type AppShellProps = {
  children: React.ReactNode;
};

function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const designerNav = [
  { label: "Home", href: "/", icon: Home },
  { label: "Tools", href: "/tools", icon: Wrench },
  { label: "Skills", href: "/skills", icon: Sparkles },
  { label: "Profile", href: "/profile", icon: BookOpen },
];

const adminNav = [
  { label: "Dashboard", href: "/admin", icon: LayoutGrid },
  { label: "Tools", href: "/admin/tools", icon: Package },
  { label: "Skills", href: "/admin/skills", icon: Sparkles },
  { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
  { label: "Categories", href: "/admin/categories", icon: Tags },
];

function LogoMark() {
  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center"
      aria-hidden
    >
      <span className="text-2xl font-semibold tracking-tight text-primary">
        A
      </span>
    </div>
  );
}

function SidebarContent() {
  const pathname = usePathname();
  const { open } = useSidebar();

  return (
    <div className="flex h-full min-h-0 flex-col justify-between overflow-hidden py-2">
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div
          className={cn(
            "mb-4 flex items-center gap-2",
            !open && "justify-center",
          )}
        >
          <LogoMark />
          <motion.div
            initial={false}
            animate={{
              opacity: open ? 1 : 0,
              width: open ? "auto" : 0,
            }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="whitespace-nowrap rounded-xl border border-white/10 bg-neutral-950/50 px-3 py-2">
              <p className="text-sm font-semibold tracking-tight text-primary">
                Asra
              </p>
              <p className="text-xs text-neutral-400">AI transformation HQ</p>
            </div>
          </motion.div>
        </div>

        <nav className="space-y-1">
          {designerNav.map((item) => {
            const active = isNavActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <SidebarLink
                key={item.href + item.label}
                link={{
                  label: item.label,
                  href: item.href,
                  icon: (
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active ? "text-primary" : "text-neutral-500",
                      )}
                    />
                  ),
                }}
                className={cn(
                  "rounded-lg",
                  open ? "px-2" : "px-0",
                  active &&
                    (open
                      ? "border-l-2 border-primary bg-white/5 pl-[6px]"
                      : "bg-primary/15 ring-1 ring-inset ring-primary/40"),
                )}
              />
            );
          })}
        </nav>

        {currentUser.role === "prime_mover" ? (
        <div className="my-4 border-t border-white/10 pt-4">
          {open ? (
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              Admin
            </p>
          ) : null}
          <nav className="space-y-1">
            {adminNav.map((item) => {
              const active = isNavActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <SidebarLink
                  key={item.href + item.label}
                  link={{
                    label: item.label,
                    href: item.href,
                    icon: (
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          active ? "text-primary" : "text-neutral-500",
                        )}
                      />
                    ),
                  }}
                  className={cn(
                    "rounded-lg",
                    open ? "px-2" : "px-0",
                    active &&
                      (open
                        ? "border-l-2 border-primary bg-white/5 pl-[6px]"
                        : "bg-primary/15 ring-1 ring-inset ring-primary/40"),
                  )}
                />
              );
            })}
          </nav>
        </div>
        ) : null}
      </div>

      <div className="mt-auto shrink-0 border-t border-white/10 pt-3">
        {open ? (
          <div className="rounded-xl border border-white/10 bg-black/40 p-3">
            <p className="text-xs text-neutral-400">Signed in as</p>
            <p className="mt-1 truncate text-sm font-medium text-neutral-100">
              {currentUser.name}
            </p>
            <p className="truncate text-xs text-neutral-500">{currentUser.email}</p>
          </div>
        ) : (
          <Link
            href="/profile"
            className="mx-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-xs font-semibold text-neutral-100 transition hover:border-white/20"
            title={currentUser.name}
          >
            {currentUser.avatar}
          </Link>
        )}
      </div>
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  const navItems = useMemo(
    () =>
      currentUser.role === "prime_mover"
        ? [...designerNav, ...adminNav]
        : designerNav,
    [],
  );

  const floatingNavItems = navItems.map((item) => {
    const Icon = item.icon;
    return {
      name: item.label,
      link: item.href,
      icon: <Icon className="h-4 w-4 shrink-0 text-neutral-500" />,
    };
  });

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-neutral-100 md:flex-row">
      <Sidebar>
        <SidebarBody className="border-r border-white/[0.04] bg-sidebar">
          <SidebarContent />
        </SidebarBody>
      </Sidebar>

      <FloatingNav navItems={floatingNavItems} className="md:hidden" />

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto min-h-full max-w-7xl px-4 py-6 md:px-8">
          <Breadcrumbs />
          {children}
        </div>
      </main>
    </div>
  );
}
