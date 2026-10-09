import type { QueryClient } from "@tanstack/react-query";
import { LOGOUT } from "@/graphql";
import { rawGraphqlClient } from "@/lib/graphql-client";
import { disconnectSocket } from "@/lib/socket-client";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNotificationsStore } from "@/stores/useNotificationsStore";
import { useOpportunitiesStore } from "@/stores/useOpportunitiesStore";

const SESSION_ENDPOINT = "/api/auth/session";

// Keys that hold data about the signed-in user. Theme and language are
// preferences of the browser, not of the account, so they are not listed.
const USER_STORAGE_KEYS = ["auth-storage", "userRole"] as const;

// Keys written by older versions that were shared by every account of the
// browser. Their content may belong to someone else, so it is dropped, not migrated.
const LEGACY_STORAGE_KEYS = ["saved-jobs"] as const;

// Longest the UI waits for the server before wiping the client anyway. A stalled
// connection must not keep the previous account's data on screen.
export const SERVER_LOGOUT_TIMEOUT_MS = 8_000;

let sessionClearInFlight: Promise<void> | null = null;

function removeStorageKeys(keys: readonly string[]): void {
  if (typeof window === "undefined") return;

  keys.forEach((key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Storage can be blocked (private mode, site data disabled): nothing to remove then.
    }
  });
}

async function waitAtMost(task: Promise<void>, milliseconds: number): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, milliseconds);
  });

  try {
    await Promise.race([task, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

function resetUserStores(): void {
  useOpportunitiesStore.getState().resetFilters();
  useOpportunitiesStore.getState().closeModal();
  useNotificationsStore.getState().close();
}

async function endServerSession(queryClient: QueryClient | null): Promise<void> {
  // A fetch still running when the cache is cleared would write the previous
  // account's data back into it.
  await queryClient?.cancelQueries();

  // rawGraphqlClient skips the UNAUTHENTICATED interceptor: a LOGOUT answered
  // with 401 must not start another logout.
  await rawGraphqlClient.request(LOGOUT).catch(() => undefined);

  if (typeof window !== "undefined") {
    await fetch(SESSION_ENDPOINT, { method: "DELETE" }).catch(() => undefined);
  }
}

async function runClearClientSession(queryClient: QueryClient | null): Promise<void> {
  // First, before any network call: from here on a late 401 from a request
  // still in flight is not an "expired session" (graphql-client ignores it
  // when nobody is logged in) and queries gated on the session stop firing.
  useAuthStore.getState().logout();

  try {
    await waitAtMost(endServerSession(queryClient), SERVER_LOGOUT_TIMEOUT_MS);
  } finally {
    // Local state is cleared even when the network calls fail, so the next
    // person on this browser never inherits it.
    disconnectSocket();
    queryClient?.clear();
    resetUserStores();
    removeStorageKeys(USER_STORAGE_KEYS);
  }
}

/**
 * Ends the current session on the server and wipes everything on the client
 * that belongs to the account: React Query cache, user stores, persisted user
 * keys and the notifications socket. Concurrent callers share one run.
 */
export function clearClientSession(queryClient: QueryClient | null): Promise<void> {
  if (!sessionClearInFlight) {
    sessionClearInFlight = runClearClientSession(queryClient).finally(() => {
      sessionClearInFlight = null;
    });
  }
  return sessionClearInFlight;
}

/** Removes storage written by older versions. Safe to call on every start. */
export function purgeLegacyStorage(): void {
  removeStorageKeys(LEGACY_STORAGE_KEYS);
}
