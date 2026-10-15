/**
 * What: Tests for useClubFollow.
 * Why: A club has two social axes with the same id (USER and CLUB) and the
 *      backend keeps two counters. The front must only ever use the CLUB axis,
 *      and a club viewer follows as a CLUB. A wrong axis would split a club's
 *      followers across two counters.
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { useClubFollow } from "@/hooks/useClubFollow";
import { graphqlClient } from "@/lib/graphql-client";
import { useAuthStore } from "@/stores/useAuthStore";
import { FOLLOW_USER, UNFOLLOW_USER } from "@/graphql";
import { toast } from "sonner";
import { mockUser } from "../test-utils";
import { Role } from "@/types/enums";

vi.mock("@/lib/graphql-client");
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const CLUB_ID = "club-1";

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

describe("useClubFollow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(graphqlClient).request = vi.fn().mockResolvedValue({ follow: { id: "f1" } });
    useAuthStore.setState({
      user: { ...mockUser, id: "viewer-1", role: Role.PLAYER },
      isLoggedIn: true,
    });
  });

  afterEach(() => {
    useAuthStore.setState({ user: null, isLoggedIn: false });
  });

  it("follows on the CLUB axis, never the USER axis", async () => {
    const { wrapper } = setup();
    const { result } = renderHook(
      () => useClubFollow({ id: CLUB_ID, isFollowedByCurrentUser: false }),
      { wrapper },
    );

    await act(async () => result.current.toggle());

    await waitFor(() =>
      expect(graphqlClient.request).toHaveBeenCalledWith(FOLLOW_USER, {
        followerType: "USER",
        followerId: "viewer-1",
        followingType: "CLUB",
        followingId: CLUB_ID,
      }),
    );
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("followed"));
  });

  it("unfollows on the CLUB axis when the viewer already follows the club", async () => {
    vi.mocked(graphqlClient).request = vi.fn().mockResolvedValue({ unfollow: true });
    const { wrapper } = setup();
    const { result } = renderHook(
      () => useClubFollow({ id: CLUB_ID, isFollowedByCurrentUser: true }),
      { wrapper },
    );

    expect(result.current.isFollowing).toBe(true);
    await act(async () => result.current.toggle());

    await waitFor(() =>
      expect(graphqlClient.request).toHaveBeenCalledWith(UNFOLLOW_USER, {
        followerType: "USER",
        followerId: "viewer-1",
        followingType: "CLUB",
        followingId: CLUB_ID,
      }),
    );
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("unfollowed"));
  });

  it("follows as a CLUB when the viewer is a club account", async () => {
    useAuthStore.setState({
      user: { ...mockUser, id: "other-club", role: Role.CLUB },
      isLoggedIn: true,
    });
    const { wrapper } = setup();
    const { result } = renderHook(
      () => useClubFollow({ id: CLUB_ID, isFollowedByCurrentUser: false }),
      { wrapper },
    );

    await act(async () => result.current.toggle());

    await waitFor(() =>
      expect(graphqlClient.request).toHaveBeenCalledWith(
        FOLLOW_USER,
        expect.objectContaining({ followerType: "CLUB", followerId: "other-club" }),
      ),
    );
  });

  it("does nothing for the owner of the club", async () => {
    useAuthStore.setState({
      user: { ...mockUser, id: CLUB_ID, role: Role.CLUB },
      isLoggedIn: true,
    });
    const { wrapper } = setup();
    const { result } = renderHook(
      () => useClubFollow({ id: CLUB_ID, isFollowedByCurrentUser: false }),
      { wrapper },
    );

    expect(result.current.canFollow).toBe(false);
    await act(async () => result.current.toggle());

    expect(graphqlClient.request).not.toHaveBeenCalled();
  });

  it("does nothing without a session", async () => {
    useAuthStore.setState({ user: null, isLoggedIn: false });
    const { wrapper } = setup();
    const { result } = renderHook(
      () => useClubFollow({ id: CLUB_ID, isFollowedByCurrentUser: false }),
      { wrapper },
    );

    await act(async () => result.current.toggle());

    expect(graphqlClient.request).not.toHaveBeenCalled();
  });

  it("warns when the backend refuses", async () => {
    vi.mocked(graphqlClient).request = vi.fn().mockRejectedValue(new Error("boom"));
    const { wrapper } = setup();
    const { result } = renderHook(
      () => useClubFollow({ id: CLUB_ID, isFollowedByCurrentUser: false }),
      { wrapper },
    );

    await act(async () => result.current.toggle());

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("followError"));
  });
});
