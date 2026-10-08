"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { verifyToken, getUserIdFromToken, getGroupsFromToken, CognitoJwtPayload } from "@/lib/cognito";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "Students" | "DeptHeads" | "SuperAdmins";
  cognitoPayload: CognitoJwtPayload;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isStudent: boolean;
  isHOD: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const payload = await verifyToken(token);
      const groups = getGroupsFromToken(payload);
      setUser({
        id: getUserIdFromToken(payload),
        email: payload.email || "",
        name: payload.name || payload["cognito:username"] || "",
        role: groups.includes("SuperAdmins")
          ? "SuperAdmins"
          : groups.includes("DeptHeads")
          ? "DeptHeads"
          : "Students",
        cognitoPayload: payload,
      });
    } catch {
      localStorage.removeItem("auth_token");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Login failed");
    }
    const { accessToken } = await res.json();
    localStorage.setItem("auth_token", accessToken);
    // Also set a cookie for API routes
    document.cookie = `auth_token=${accessToken}; path=/; max-age=3600; SameSite=Strict`;
    const payload = await verifyToken(accessToken);
    const groups = getGroupsFromToken(payload);
    setUser({
      id: getUserIdFromToken(payload),
      email,
      name: payload.name || email.split("@")[0],
      role: groups.includes("SuperAdmins")
        ? "SuperAdmins"
        : groups.includes("DeptHeads")
        ? "DeptHeads"
        : "Students",
      cognitoPayload: payload,
    });
  }, []);

  const logout = useCallback(async () => {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); } catch {}
    localStorage.removeItem("auth_token");
    document.cookie = "auth_token=; path=/; max-age=0; SameSite=Strict";
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) { setUser(null); return; }
    try {
      const payload = await verifyToken(token);
      const groups = getGroupsFromToken(payload);
      setUser({
        id: getUserIdFromToken(payload),
        email: payload.email || "",
        name: payload.name || payload["cognito:username"] || "",
        role: groups.includes("SuperAdmins")
          ? "SuperAdmins"
          : groups.includes("DeptHeads")
          ? "DeptHeads"
          : "Students",
        cognitoPayload: payload,
      });
    } catch {
      localStorage.removeItem("auth_token");
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      logout,
      refreshUser,
      isStudent: user?.role === "Students",
      isHOD: user?.role === "DeptHeads",
      isAdmin: user?.role === "DeptHeads" || user?.role === "SuperAdmins",
    }),
    [user, isLoading, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
