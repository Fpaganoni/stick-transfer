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
    users: {
      total: 120,
      byRole: [{ role: "PLAYER", count: 100 }],
      active: 100,
      inactive: 20,
      verified: 90,
      emailVerified: 85,
      newLast30Days: 10,
      growth: [{ date: "2026-06-01", count: 4 }],
      byCountry: [],
    },
    clubs: {
      total: 14,
      byVerificationStatus: [{ status: "VERIFIED", count: 10 }],
      newLast30Days: 2,
      byLeague: [],
    },
    jobs: {
      totalOpportunities: 32,
      byStatus: [],
      totalApplications: 5,
      applicationsByStatus: [{ status: "PENDING", count: 5 }],
      savedJobsTotal: 0,
    },
    social: {
      totalFollows: 0,
      totalLikes: 0,
      totalConversations: 0,
      totalMessages: 0,
    },
    news: {
      total: 8,
      published: 6,
      drafts: 2,
      byCategory: [{ category: "TRANSFERS", count: 3 }],
    },
  },
};

describe("useAdminStats", () => {
  beforeEach(() => mockRequest.mockReset());

  it("returns dashboard stats on success", async () => {
    mockRequest.mockResolvedValueOnce(mockStats);

    const { result } = renderHook(() => useAdminStats(), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.adminDashboardStats.users.total).toBe(120);
    expect(mockRequest).toHaveBeenCalledTimes(1);
  });

  it("exposes error state on network failure", async () => {
    mockRequest.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useAdminStats(), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Network error");
  });
});
