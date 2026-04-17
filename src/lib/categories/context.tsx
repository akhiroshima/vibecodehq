"use client";

import { createContext, useContext, useMemo } from "react";
import type { ContentCategory } from "@/lib/mock-data";

type CategoriesContextValue = {
  categories: ContentCategory[];
  getLabel: (id: string) => string;
  getById: (id: string) => ContentCategory | undefined;
  filterOptions: string[];
};

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

export function CategoriesProvider({
  initial,
  children,
}: {
  initial: ContentCategory[];
  children: React.ReactNode;
}) {
  const value = useMemo<CategoriesContextValue>(() => {
    const byId = new Map(initial.map((c) => [c.id, c]));
    return {
      categories: initial,
      getLabel: (id: string) => byId.get(id)?.name ?? "Uncategorized",
      getById: (id: string) => byId.get(id),
      filterOptions: ["All", ...initial.map((c) => c.name)],
    };
  }, [initial]);

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) {
    throw new Error("useCategories must be used within CategoriesProvider");
  }
  return ctx;
}
