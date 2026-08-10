"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { setAuthToken } from "@/lib/graphql-client";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";

export function AuthInitializer() {
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    setAuthToken(token);
    // Sync cookie with hydrated Zustand state so middleware stays in sync
    fetch("/api/auth/session", { method: token ? "POST" : "DELETE" }).catch(
      () => {},
    );
  }, [token]);

  useNotificationSocket();

  return null;
}
