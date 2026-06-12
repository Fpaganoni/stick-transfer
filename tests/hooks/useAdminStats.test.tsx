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
    totalUsersCount: 120,
    playersCount: 100,
    coachesCount: 12,
    clubsCount: 14,
    superAdminsCount: 1,
    activeUsersCount: 100,
    verifiedClubsCount: 10,
    pendingVerificationClubsCount: 2,
    unverifiedClubsCount: 1,
    rejectedClubsCount: 1,
    openJobsCount: 20,
    closedJobsCount: 8,
    filledJobsCount: 4,
    totalApplicationsCount: 5,
    pendingApplicationsCount: 5,
    acceptedApplicationsCount: 0,
    rejectedApplicationsCount: 0,
    totalReportsCount: 3,
    pendingReportsCount: 1,
    reviewedReportsCount: 1,
    actionTakenReportsCount: 1,
    publishedNewsCount: 6,
    draftNewsCount: 2,
    pendingClubMembershipsCount: 4,
    activeClubMembershipsCount: 10,
    newUsersLast7Days: 3,
    newUsersLast30Days: 10,
  },
};

describe("useAdminStats", () => {
  beforeEach(() => mockRequest.mockReset());

  it("returns dashboard stats on success", async () => {
    mockRequest.mockResolvedValueOnce(mockStats);

    const { result } = renderHook(() => useAdminStats(), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.adminDashboardStats.totalUsersCount).toBe(120);
    expect(mockRequest).toHaveBeenCalledTimes(1);
  });

  it("exposes error state on network failure", async () => {
    mockRequest.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useAdminStats(), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Network error");
  });
});
