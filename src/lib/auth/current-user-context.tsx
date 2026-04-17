"use client";

import { createContext, useContext } from "react";
import type { SessionAppUser } from "@/lib/auth/types";

const CurrentUserContext = createContext<SessionAppUser | null>(null);

export function CurrentUserProvider({
  user,
  children,
}: {
  user: SessionAppUser;
  children: React.ReactNode;
}) {
  return (
    <CurrentUserContext.Provider value={user}>{children}</CurrentUserContext.Provider>
  );
}

export function useSessionUser(): SessionAppUser {
  const v = useContext(CurrentUserContext);
  if (!v) {
    throw new Error("useSessionUser must be used within CurrentUserProvider");
  }
  return v;
}
