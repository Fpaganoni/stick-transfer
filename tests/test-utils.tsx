/**
 * Shared test utilities.
 *
 * What: QueryClient wrapper + pre-built mock User / JobOpportunity fixtures.
 * Why: Isolates tests from real network, avoids repetitive boilerplate across
 *      every test file, and keeps fixtures type-safe.
 */
import React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Role } from "@/types/enums";
import type { User } from "@/types/models/user";
import type { JobOpportunity } from "@/types/models/job-opportunity";

// ── Query client factory (fresh per test) ────────────────────────────────────
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

// ── Wrapper component ────────────────────────────────────────────────────────
function TestProviders({ children }: { children: React.ReactNode }) {
  const qc = createTestQueryClient();
  return (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: TestProviders, ...options });
}

// ── Fixtures ─────────────────────────────────────────────────────────────────
export const mockUser: User = {
  id: "user-1",
  email: "franco@test.com",
  name: "Franco Test",
  username: "franco_test",
  role: Role.PLAYER,
  isEmailVerified: true,
  avatar: "https://example.com/avatar.jpg",
};

export const mockJobOpportunity: JobOpportunity = {
  id: "job-1",
  title: "Winger Needed",
  description: "Looking for an experienced winger",
  positionType: "attacker",
  level: "professional",
  country: "Canada",
  city: "Toronto",
  salary: 75000,
  currency: "CAD",
  benefits: ["health", "housing"],
  status: "open",
  club: { id: "club-1", name: "Toronto HC" },
  createdAt: "2024-01-01T00:00:00Z",
};
