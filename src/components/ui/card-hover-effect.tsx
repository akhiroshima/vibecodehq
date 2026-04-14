"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { GlowCard } from "@/components/ui/glow-card";

export const HoverEffect = ({
  items,
  className,
  renderCard,
}: {
  items: {
    title: string;
    description: string;
    link: string;
    status?: "active" | "beta";
  }[];
  className?: string;
  renderCard?: (item: {
    title: string;
    description: string;
    link: string;
    status?: "active" | "beta";
  }) => React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 py-10",
        className,
      )}
    >
      {items.map((item) => {
        const isInternal = item.link.startsWith("/");
        const classNameInner = "relative group block h-full w-full p-2";
        const inner = (
          <GlowCard className="h-full" contentClassName="min-h-[160px] overflow-hidden">
            <Card>
              {renderCard ? (
                renderCard(item)
              ) : (
                <>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </>
              )}
            </Card>
          </GlowCard>
        );
        return isInternal ? (
          <Link key={item.link} href={item.link} className={classNameInner}>
            {inner}
          </Link>
        ) : (
          <a key={item.link} href={item.link} className={classNameInner}>
            {inner}
          </a>
        );
      })}
    </div>
  );
};

export const Card = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <div className={cn("relative z-20 h-full w-full", className)}>
      <div className="p-4">{children}</div>
    </div>
  );
};

export const CardTitle = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <h4 className={cn("text-zinc-100 font-bold tracking-wide mt-4", className)}>
      {children}
    </h4>
  );
};

export const CardDescription = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <p
      className={cn(
        "mt-8 text-zinc-400 tracking-wide leading-relaxed text-sm",
        className,
      )}
    >
      {children}
    </p>
  );
};
