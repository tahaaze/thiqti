"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { setHistoryUser } from "@/lib/history";

export interface ClientUser {
  id: string;
  email: string;
  fullName: string | null;
  emailVerified: boolean;
}

/**
 * Hook client pour suivre l'état de connexion et proposer login/logout.
 * Utilise /api/auth/me pour recharger l'état depuis le cookie httpOnly.
 */
export function useAuth() {
  const [user, setUser] = useState<ClientUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      const u = data.user || null;
      setUser(u);
      setHistoryUser(u?.id ?? null);
    } catch {
      setUser(null);
      setHistoryUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setHistoryUser(null);
    router.refresh();
  }

  return { user, loading, refresh, logout };
}
