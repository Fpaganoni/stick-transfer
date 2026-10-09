import type { QueryClient } from "@tanstack/react-query";

// Code that runs outside React (the GraphQL interceptor, zustand actions)
// cannot call useQueryClient(). QueryProvider registers its client here so
// those callers can still clear the cache when the session ends.
let registeredClient: QueryClient | null = null;

export function registerQueryClient(client: QueryClient): void {
  registeredClient = client;
}

export function getRegisteredQueryClient(): QueryClient | null {
  return registeredClient;
}
