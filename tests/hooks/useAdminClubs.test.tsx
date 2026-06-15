/**
 * What: Unit tests for useAdminClubs query and useAdminSetClubVerification mutation.
 * Why: Verifies that the flat `clubs` list is filtered/paginated client-side
 *      (backend has no adminClubs/AdminClubFiltersInput) and membersCount is
 *      derived from members.length, and the verification mutation (approve/
 *      reject) is called with clubId + status.
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
  members: [{ id: "m1" }, { id: "m2" }],
};

const verifiedClubRow = {
  id: "club-2",
  name: "HC Madrid",
  city: "Madrid",
  country: "ES",
  league: "División de Honor",
  verificationStatus: "VERIFIED" as const,
  isVerified: true,
  createdAt: "2026-01-02T00:00:00.000Z",
  members: [],
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

  it("fetches the flat clubs list, filters client-side and derives membersCount", async () => {
    mockRequest.mockResolvedValueOnce({ clubs: [mockClubRow, verifiedClubRow] });

    const { result } = renderHook(
      () => useAdminClubs({ verificationStatus: "PENDING" }, 1, 20),
      { wrapper: wrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.adminClubs.items).toHaveLength(1);
    expect(result.current.data?.adminClubs.items[0].id).toBe("club-1");
    expect(result.current.data?.adminClubs.items[0].membersCount).toBe(2);
    expect(result.current.data?.adminClubs.total).toBe(1);
    expect(mockRequest).toHaveBeenCalledWith(expect.anything());
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
