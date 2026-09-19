"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";

export function AuthInitializer() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  useEffect(() => {
    // Sync the (flag-only) middleware cookie with hydrated Zustand state.
    // Actual auth to the GraphQL backend rides on its own httpOnly cookie,
    // sent automatically via credentials: "include".
    fetch("/api/auth/session", {
      method: isLoggedIn ? "POST" : "DELETE",
    }).catch(() => {});
  }, [isLoggedIn]);

  useNotificationSocket();

  return null;
}
