import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/** True only after the client has mounted; false during SSR and the first client render, avoiding hydration mismatches without an effect. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
