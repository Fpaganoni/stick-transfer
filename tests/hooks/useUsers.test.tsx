/**
 * What: Integration tests for useUser / useUsers / useUser(disabled) hooks
 *       and the optimistic follow / unfollow mutations.
 * Why: These hooks drive most data-fetching on the platform. Testing the
 *      `enabled` guard on useUser is critical: a null userId must never fire
 *      a real request (would cause a 400 from the GraphQL endpoint).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useUser, useUsers, useUpdateUser, useFollow, useUnfollow } from "@/hooks/useUsers";
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

describe("useFollow / useUnfollow optimistic update", () => {
  const vars = {
    followerType: "USER",
    followerId: "viewer-1",
    followingType: "USER",
    followingId: "target-1",
  };

  function seededClient({ isFollowing }: { isFollowing: boolean }) {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    qc.setQueryData(["user", "username", "target"], {
      getUserByUsername: { id: "target-1", followersCount: 7, isFollowedByCurrentUser: isFollowing },
    });
    qc.setQueryData(["user", "target-1"], {
      user: { id: "target-1", followersCount: 7, isFollowedByCurrentUser: isFollowing },
    });
    // `me` itself carries no counters; they live in their own query
    qc.setQueryData(["me"], { me: { id: "viewer-1", name: "Viewer" } });
    qc.setQueryData(["me", "followCounts"], {
      me: { id: "viewer-1", followersCount: 5, followingCount: 2 },
    });
    return qc;
  }

  function wrapperFor(qc: QueryClient) {
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
    };
  }

  const target = (qc: QueryClient) =>
    qc.getQueryData<{ getUserByUsername: Record<string, unknown> }>([
      "user",
      "username",
      "target",
    ])?.getUserByUsername;
  const targetById = (qc: QueryClient) =>
    qc.getQueryData<{ user: Record<string, unknown> }>(["user", "target-1"])?.user;
  const me = (qc: QueryClient) =>
    qc.getQueryData<{ me: Record<string, unknown> }>(["me", "followCounts"])?.me;
  const plainMe = (qc: QueryClient) => qc.getQueryData<{ me: Record<string, unknown> }>(["me"])?.me;

  /** Keeps the request in flight so the optimistic state can be asserted; release() settles it. */
  function pendingRequest() {
    let resolve: (value: unknown) => void = () => {};
    mockRequest.mockReturnValue(new Promise((r) => (resolve = r)));
    return () => resolve({ follow: { id: "f1" }, unfollow: true });
  }

  // Block body: a beforeEach that returns the mock makes Vitest call it as a cleanup hook
  beforeEach(() => {
    mockRequest.mockReset();
  });

  it("updates the counters and the button before the server answers", async () => {
    const release = pendingRequest();
    const qc = seededClient({ isFollowing: false });
    const { result } = renderHook(() => useFollow(), { wrapper: wrapperFor(qc) });

    act(() => result.current.mutate(vars));

    await waitFor(() => expect(target(qc)).toMatchObject({ followersCount: 8 }));
    expect(target(qc)).toMatchObject({ isFollowedByCurrentUser: true });
    expect(targetById(qc)).toMatchObject({ followersCount: 8, isFollowedByCurrentUser: true });
    expect(me(qc)).toMatchObject({ followingCount: 3 });
    expect(plainMe(qc)).not.toHaveProperty("followingCount");

    await act(async () => release());
  });

  it("rolls back when the follow fails", async () => {
    mockRequest.mockRejectedValue(new Error("boom"));
    const qc = seededClient({ isFollowing: false });
    const { result } = renderHook(() => useFollow(), { wrapper: wrapperFor(qc) });

    act(() => result.current.mutate(vars));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(target(qc)).toMatchObject({ followersCount: 7, isFollowedByCurrentUser: false });
    expect(me(qc)).toMatchObject({ followingCount: 2 });
  });

  it("invalidates the own profile and the follow lists once settled", async () => {
    mockRequest.mockResolvedValue({ follow: { id: "f1" } });
    const qc = seededClient({ isFollowing: false });
    const invalidate = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useFollow(), { wrapper: wrapperFor(qc) });

    await act(async () => {
      await result.current.mutateAsync(vars);
    });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["me"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["followList"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["user"] });
  });

  it("decrements the counters on unfollow", async () => {
    const release = pendingRequest();
    const qc = seededClient({ isFollowing: true });
    const { result } = renderHook(() => useUnfollow(), { wrapper: wrapperFor(qc) });

    act(() => result.current.mutate(vars));

    await waitFor(() => expect(target(qc)).toMatchObject({ followersCount: 6 }));
    expect(target(qc)).toMatchObject({ isFollowedByCurrentUser: false });
    expect(me(qc)).toMatchObject({ followingCount: 1 });

    await act(async () => release());
  });

  it("does not count twice when the cache already shows the target state", async () => {
    const release = pendingRequest();
    const qc = seededClient({ isFollowing: true });
    const { result } = renderHook(() => useFollow(), { wrapper: wrapperFor(qc) });

    act(() => result.current.mutate(vars));

    await waitFor(() => expect(mockRequest).toHaveBeenCalled());
    expect(target(qc)).toMatchObject({ followersCount: 7, isFollowedByCurrentUser: true });
    expect(me(qc)).toMatchObject({ followingCount: 2 });

    await act(async () => release());
  });
});
