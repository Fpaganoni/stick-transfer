/**
 * What: Unit tests for useAdminUsers query and mutation hooks.
 * Why: Verifies the users list query passes filters/pagination through, and
 *      that the activate/verify/role-change mutations call the GraphQL client
 *      with the expected variables (the optimistic-update plumbing depends on it).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useAdminUsers,
  useAdminSetUserActive,
  useAdminSetUserVerified,
  useAdminChangeUserRole,
} from "@/hooks/useAdminUsers";
import { Role } from "@/types/enums";

const mockRequest = vi.fn();
vi.mock("@/lib/graphql-client", () => ({
  graphqlClient: { request: (...args: unknown[]) => mockRequest(...args) },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockUserRow = {
  id: "user-1",
  fullName: "Franco Paganoni",
  email: "franco@test.com",
  role: Role.PLAYER,
  isActive: true,
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

describe("useAdminUsers", () => {
  beforeEach(() => mockRequest.mockReset());

  it("fetches users with filters and pagination variables", async () => {
    mockRequest.mockResolvedValueOnce({
      adminUsers: { items: [mockUserRow], total: 1, hasMore: false },
    });

    const { result } = renderHook(() => useAdminUsers({ role: Role.PLAYER }, 2, 20), {
      wrapper: wrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.adminUsers.items).toHaveLength(1);
    expect(mockRequest).toHaveBeenCalledWith(
      expect.anything(),
      { filters: { role: Role.PLAYER }, page: 2, limit: 20 }
    );
  });
});

describe("useAdminSetUserActive", () => {
  beforeEach(() => mockRequest.mockReset());

  it("mutates with userId and isActive", async () => {
    mockRequest.mockResolvedValueOnce({ adminSetUserActive: { ...mockUserRow, isActive: false } });

    const { result } = renderHook(() => useAdminSetUserActive(), { wrapper: wrapper() });
    result.current.mutate({ userId: "user-1", isActive: false });

    await waitFor(() => expect(mockRequest).toHaveBeenCalled());
    expect(mockRequest).toHaveBeenCalledWith(expect.anything(), {
      userId: "user-1",
      isActive: false,
    });
  });
});

describe("useAdminSetUserVerified", () => {
  beforeEach(() => mockRequest.mockReset());

  it("mutates with userId and isVerified", async () => {
    mockRequest.mockResolvedValueOnce({ adminSetUserVerified: { ...mockUserRow, isVerified: true } });

    const { result } = renderHook(() => useAdminSetUserVerified(), { wrapper: wrapper() });
    result.current.mutate({ userId: "user-1", isVerified: true });

    await waitFor(() => expect(mockRequest).toHaveBeenCalled());
    expect(mockRequest).toHaveBeenCalledWith(expect.anything(), {
      userId: "user-1",
      isVerified: true,
    });
  });
});

describe("useAdminChangeUserRole", () => {
  beforeEach(() => mockRequest.mockReset());

  it("mutates with userId and the new role", async () => {
    mockRequest.mockResolvedValueOnce({ adminChangeUserRole: { ...mockUserRow, role: Role.COACH } });

    const { result } = renderHook(() => useAdminChangeUserRole(), { wrapper: wrapper() });
    result.current.mutate({ userId: "user-1", role: Role.COACH });

    await waitFor(() => expect(mockRequest).toHaveBeenCalled());
    expect(mockRequest).toHaveBeenCalledWith(expect.anything(), {
      userId: "user-1",
      role: Role.COACH,
    });
  });
});
