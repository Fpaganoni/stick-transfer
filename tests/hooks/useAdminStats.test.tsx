/**
 * What: Unit tests for useAdminStats query hook.
 * Why: Verifies the dashboard stats query fires with the correct GraphQL
 *      operation and exposes loading/success/error states to the Overview page.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useAdminStats } from "@/hooks/useAdminStats";

const mockRequest = vi.fn();
vi.mock("@/lib/graphql-client", () => ({
  graphqlClient: { request: (...args: unknown[]) => mockRequest(...args) },
}));

function wrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

const mockStats = {
  adminDashboardStats: {
    totalUsers: 120,
    totalClubs: 14,
    totalJobOpportunities: 32,
    totalNewsArticles: 8,
    usersByRole: [{ role: "PLAYER", count: 100 }],
    clubsByVerificationStatus: [{ status: "VERIFIED", count: 10 }],
    applicationsByStatus: [{ status: "PENDING", count: 5 }],
    newsByCategory: [{ category: "TRANSFERS", count: 3 }],
    userGrowth: [{ date: "2026-06-01", count: 4 }],
  },
};

describe("useAdminStats", () => {
  beforeEach(() => mockRequest.mockReset());

  it("returns dashboard stats on success", async () => {
    mockRequest.mockResolvedValueOnce(mockStats);

    const { result } = renderHook(() => useAdminStats(), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.adminDashboardStats.totalUsers).toBe(120);
    expect(mockRequest).toHaveBeenCalledTimes(1);
  });

  it("exposes error state on network failure", async () => {
    mockRequest.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useAdminStats(), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Network error");
  });
});
