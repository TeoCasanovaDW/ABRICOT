"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { User } from "@/types";

const AuthContext = createContext<User | undefined>(undefined);

interface AuthProviderProps {
  user: User;
  children: ReactNode;
}

// Value is supplied by the (app) layout's single GET /auth/profile fetch
// (specs/04) — no fetching happens here.
export function AuthProvider({ user, children }: AuthProviderProps) {
  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

export function useAuth(): User {
  const user = useContext(AuthContext);

  if (user === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return user;
}
