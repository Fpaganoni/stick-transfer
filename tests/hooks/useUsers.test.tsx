/**
 * What: Integration tests for useUser / useUsers / useUser(disabled) hooks.
 * Why: These hooks drive most data-fetching on the platform. Testing the
 *      `enabled` guard on useUser is critical: a null userId must never fire
 *      a real request (would cause a 400 from the GraphQL endpoint).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useUser, useUsers } from "@/hooks/useUsers";
import { mockUser } from "../test-utils";

// ── Mock graphqlClient ────────────────────────────────────────────────────────
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

describe("useUsers", () => {
  beforeEach(() => mockRequest.mockReset());

  it("returns users list on success", async () => {
    mockRequest.mockResolvedValueOnce({ users: [mockUser] });
    const { result } = renderHook(() => useUsers(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.users).toHaveLength(1);
    expect(result.current.data?.users[0].id).toBe("user-1");
  });

  it("exposes error state on network failure", async () => {
    mockRequest.mockRejectedValueOnce(new Error("Network error"));
    const { result } = renderHook(() => useUsers(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Network error");
  });
});

describe("useUser", () => {
  beforeEach(() => mockRequest.mockReset());

  it("fetches user when userId is provided", async () => {
    mockRequest.mockResolvedValueOnce({ user: mockUser });
    const { result } = renderHook(() => useUser("user-1"), {
      wrapper: wrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.user.email).toBe("franco@test.com");
  });

  it("does NOT fire a request when userId is null (enabled guard)", () => {
    renderHook(() => useUser(null), { wrapper: wrapper() });
    // graphqlClient.request must never be called with a null id
    expect(mockRequest).not.toHaveBeenCalled();
  });

  it("remains in 'pending' state when userId is null", () => {
    const { result } = renderHook(() => useUser(null), {
      wrapper: wrapper(),
    });
    expect(result.current.isPending).toBe(true);
    expect(result.current.isFetching).toBe(false);
  });
});
