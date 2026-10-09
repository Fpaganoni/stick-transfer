/**
 * What: Unit tests for useJobOpportunities initialData handling.
 * Why: /opportunities is server-rendered without the session cookie, so the
 *      initialData it passes carries isSavedByCurrentUser=false for everyone.
 *      With a session the hook must refetch on mount instead of trusting it.
 */
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useJobOpportunities } from "@/hooks/useJobOpportunities";
import { graphqlClient } from "@/lib/graphql-client";
import { useAuthStore } from "@/stores/useAuthStore";
import type { JobOpportunity } from "@/types/models/job-opportunity";
import { mockUser } from "../test-utils";

vi.mock("@/lib/graphql-client");

const serverRenderedJob = {
  id: "job-1",
  title: "Server rendered",
  isSavedByCurrentUser: false,
} as unknown as JobOpportunity;

const freshJob = { ...serverRenderedJob, isSavedByCurrentUser: true } as JobOpportunity;

function createWrapper() {
  // Same staleTime as the app's QueryProvider, otherwise initialData is never refetched.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 60 * 1000 } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useJobOpportunities initialData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, isLoggedIn: false });
  });

  it("refetches on mount when there is a session, replacing the cookie-less server data", async () => {
    useAuthStore.setState({ user: mockUser, isLoggedIn: true });
    const request = vi.fn().mockResolvedValue({ jobOpportunities: [freshJob] });
    vi.mocked(graphqlClient).request = request;

    const { result } = renderHook(
      () => useJobOpportunities(undefined, { jobOpportunities: [serverRenderedJob] }),
      { wrapper: createWrapper() },
    );

    await waitFor(() =>
      expect(result.current.data?.jobOpportunities[0].isSavedByCurrentUser).toBe(true),
    );
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("keeps the server data without a session", async () => {
    const request = vi.fn().mockResolvedValue({ jobOpportunities: [freshJob] });
    vi.mocked(graphqlClient).request = request;

    const { result } = renderHook(
      () => useJobOpportunities(undefined, { jobOpportunities: [serverRenderedJob] }),
      { wrapper: createWrapper() },
    );

    expect(result.current.data?.jobOpportunities[0].isSavedByCurrentUser).toBe(false);
    expect(request).not.toHaveBeenCalled();
  });
});
