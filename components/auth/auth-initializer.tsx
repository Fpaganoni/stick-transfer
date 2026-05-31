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
    if (token) {
      document.cookie = "st-auth=1; path=/; max-age=2592000; SameSite=Lax";
    } else {
      document.cookie = "st-auth=; path=/; max-age=0";
    }
  }, [token]);

  useNotificationSocket();

  return null;
}
