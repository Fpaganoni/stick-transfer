import { useSyncExternalStore } from "react";
import { useAuthStore } from "@/stores/useAuthStore";

const subscribe = (onChange: () => void) => useAuthStore.persist.onFinishHydration(onChange);
const getSnapshot = () => useAuthStore.persist.hasHydrated();
const getServerSnapshot = () => false;

/**
 * True once the persisted auth store has been read from localStorage. False on
 * the server and during the hydration render (so markup matches the server),
 * then true for the rest of the page session: client-side navigations never
 * see it flip back.
 */
export function useAuthHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
