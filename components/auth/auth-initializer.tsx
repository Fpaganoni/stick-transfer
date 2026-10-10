"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/useAuthStore";
import { clearClientSession, purgeLegacyStorage } from "@/lib/session";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";
import { graphqlClient } from "@/lib/graphql-client";
import { ME } from "@/graphql/user/queries";
import { isUnauthenticatedError } from "@/lib/graphql-errors";

export function AuthInitializer() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const queryClient = useQueryClient();

  // Older versions kept saved jobs in a localStorage key shared by every
  // account of the browser; whatever is there may belong to someone else.
  useEffect(() => {
    purgeLegacyStorage();
  }, []);

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
      } catch (error) {
        if (ignore) return;
        // Only a rejected session logs out. Offline, or a reload aborting this
        // request, must keep it: the next start checks again.
        if (isUnauthenticatedError(error)) {
          await clearClientSession(queryClient);
        }
      }
    }

    syncSession();

    return () => {
      ignore = true;
    };
  }, [isLoggedIn, queryClient]);

  useNotificationSocket();

  return null;
}
