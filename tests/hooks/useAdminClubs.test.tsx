/**
 * What: Unit tests for useAdminClubs query and useAdminSetClubVerification mutation.
 * Why: Verifies the clubs list query forwards filters/pagination, and the
 *      verification mutation (approve/reject) is called with clubId + status.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useAdminClubs, useAdminSetClubVerification } from "@/hooks/useAdminClubs";

const mockRequest = vi.fn();
vi.mock("@/lib/graphql-client", () => ({
  graphqlClient: { request: (...args: unknown[]) => mockRequest(...args) },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockClubRow = {
  id: "club-1",
  name: "HC Barcelona",
  city: "Barcelona",
  country: "ES",
  league: "División de Honor",
  verificationStatus: "PENDING" as const,
  isVerified: false,
  createdAt: "2026-01-01T00:00:00.000Z",
};

function wrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

describe("useAdminClubs", () => {
  beforeEach(() => mockRequest.mockReset());

  it("fetches clubs with filters and pagination variables", async () => {
    mockRequest.mockResolvedValueOnce({
      adminClubs: { items: [mockClubRow], total: 1, hasMore: false },
    });

    const { result } = renderHook(
      () => useAdminClubs({ verificationStatus: "PENDING" }, 1, 20),
      { wrapper: wrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.adminClubs.items).toHaveLength(1);
    expect(mockRequest).toHaveBeenCalledWith(expect.anything(), {
      filters: { verificationStatus: "PENDING" },
      page: 1,
      limit: 20,
    });
  });
});

describe("useAdminSetClubVerification", () => {
  beforeEach(() => mockRequest.mockReset());

  it("mutates with clubId and the target status", async () => {
    mockRequest.mockResolvedValueOnce({
      adminSetClubVerification: { ...mockClubRow, verificationStatus: "VERIFIED", isVerified: true },
    });

    const { result } = renderHook(() => useAdminSetClubVerification(), { wrapper: wrapper() });
    result.current.mutate({ clubId: "club-1", status: "VERIFIED" });

    await waitFor(() => expect(mockRequest).toHaveBeenCalled());
    expect(mockRequest).toHaveBeenCalledWith(expect.anything(), {
      clubId: "club-1",
      status: "VERIFIED",
    });
  });
});
