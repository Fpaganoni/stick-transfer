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
import { useUser, useUsers, useUpdateUser } from "@/hooks/useUsers";
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

describe("useUpdateUser", () => {
  beforeEach(() => mockRequest.mockReset());

  it("sends the umpire variables untouched", async () => {
    mockRequest.mockResolvedValueOnce({ updateUser: { id: "user-1" } });
    const { result } = renderHook(() => useUpdateUser(), { wrapper: wrapper() });

    result.current.mutate({
      id: "user-1",
      licenseLevel: "NACIONAL" as never,
      umpireCertifications: [{ name: "Licencia", issuer: "CAH", order: 0 }],
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockRequest.mock.calls[0][1]).toMatchObject({
      id: "user-1",
      licenseLevel: "NACIONAL",
      umpireCertifications: [{ name: "Licencia", issuer: "CAH", order: 0 }],
    });
  });

  it("invalidates the me query so role-gated UI reflects the saved profile", async () => {
    mockRequest.mockResolvedValueOnce({ updateUser: { id: "user-1" } });
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const spy = vi.spyOn(qc, "invalidateQueries");
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useUpdateUser(), { wrapper: Wrapper });

    result.current.mutate({ id: "user-1", bio: "x" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(spy).toHaveBeenCalledWith({ queryKey: ["me"] });
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
