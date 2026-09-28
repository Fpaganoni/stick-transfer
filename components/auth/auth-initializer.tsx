"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";
import { graphqlClient } from "@/lib/graphql-client";
import { ME } from "@/graphql/user/queries";

export function AuthInitializer() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    let ignore = false;

    async function syncSession() {
      if (!isLoggedIn) {
        await fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
        return;
      }

      // `isLoggedIn` comes from localStorage and can be stale (real session
      // cookie expired, revoked, or cleared without touching localStorage).
      // Confirm against the backend before re-arming the `st-auth` routing
      // flag — otherwise a dead session keeps passing proxy.ts's gate.
      try {
        await graphqlClient.request(ME);
        if (ignore) return;
        await fetch("/api/auth/session", { method: "POST" }).catch(() => {});
      } catch {
        if (ignore) return;
        await logout();
      }
    }

    syncSession();

    return () => {
      ignore = true;
    };
  }, [isLoggedIn, logout]);

  useNotificationSocket();

  return null;
}
