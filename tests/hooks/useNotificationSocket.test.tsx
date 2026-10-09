/**
 * What: Tests for useNotificationSocket.
 * Why: The socket carries private notifications. It must be closed as soon as
 *      the session ends, be re-opened for the next account, and must not flap
 *      when only profile fields of the same user change.
 */
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";
import { notificationsCountQueryKey } from "@/hooks/useNotifications";
import { useAuthStore } from "@/stores/useAuthStore";
import { NotificationType } from "@/types/models/notification";
import { mockUser } from "../test-utils";

const { connectSocketMock, disconnectSocketMock, fakeSocket } = vi.hoisted(() => ({
  connectSocketMock: vi.fn(),
  disconnectSocketMock: vi.fn(),
  fakeSocket: { on: vi.fn(), off: vi.fn() },
}));

vi.mock("@/lib/socket-client", () => ({
  connectSocket: connectSocketMock,
  disconnectSocket: disconnectSocketMock,
  getSocket: () => fakeSocket,
}));

vi.mock("sonner", () => ({ toast: vi.fn() }));

const otherUser = { ...mockUser, id: "user-2", email: "other@test.com" };

function createHarness() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { queryClient, Wrapper };
}

describe("useNotificationSocket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, isLoggedIn: false });
  });

  it("stays disconnected without a session", () => {
    const { Wrapper } = createHarness();

    renderHook(() => useNotificationSocket(), { wrapper: Wrapper });

    expect(connectSocketMock).not.toHaveBeenCalled();
  });

  it("connects once there is a session", () => {
    useAuthStore.setState({ user: mockUser, isLoggedIn: true });
    const { Wrapper } = createHarness();

    renderHook(() => useNotificationSocket(), { wrapper: Wrapper });

    expect(connectSocketMock).toHaveBeenCalledTimes(1);
    expect(fakeSocket.on).toHaveBeenCalledWith("notification", expect.any(Function));
  });

  it("disconnects and stops listening when the session ends", () => {
    useAuthStore.setState({ user: mockUser, isLoggedIn: true });
    const { Wrapper } = createHarness();
    renderHook(() => useNotificationSocket(), { wrapper: Wrapper });

    act(() => useAuthStore.getState().logout());

    expect(disconnectSocketMock).toHaveBeenCalledTimes(1);
    expect(fakeSocket.off).toHaveBeenCalledWith("notification", expect.any(Function));
    expect(connectSocketMock).toHaveBeenCalledTimes(1);
  });

  it("drops the previous account's connection before opening the next one", () => {
    useAuthStore.setState({ user: mockUser, isLoggedIn: true });
    const { Wrapper } = createHarness();
    renderHook(() => useNotificationSocket(), { wrapper: Wrapper });

    act(() => useAuthStore.setState({ user: otherUser, isLoggedIn: true }));

    expect(connectSocketMock).toHaveBeenCalledTimes(2);
    expect(disconnectSocketMock).toHaveBeenCalledTimes(1);
    expect(disconnectSocketMock.mock.invocationCallOrder[0]).toBeLessThan(
      connectSocketMock.mock.invocationCallOrder[1],
    );
  });

  it("keeps the connection when only profile fields change", () => {
    useAuthStore.setState({ user: mockUser, isLoggedIn: true });
    const { Wrapper } = createHarness();
    renderHook(() => useNotificationSocket(), { wrapper: Wrapper });

    act(() => useAuthStore.getState().updateUser({ bio: "Plays left wing" }));

    expect(connectSocketMock).toHaveBeenCalledTimes(1);
    expect(disconnectSocketMock).not.toHaveBeenCalled();
  });

  it("counts an incoming notification for the current user", () => {
    useAuthStore.setState({ user: mockUser, isLoggedIn: true });
    const { queryClient, Wrapper } = createHarness();
    queryClient.setQueryData(notificationsCountQueryKey(mockUser.id), {
      unreadNotificationsCount: 2,
    });
    renderHook(() => useNotificationSocket(), { wrapper: Wrapper });
    const handler = fakeSocket.on.mock.calls.find(([event]) => event === "notification")?.[1];

    act(() => handler({ id: "n-1", type: NotificationType.NEW_FOLLOWER }));

    expect(queryClient.getQueryData(notificationsCountQueryKey(mockUser.id))).toEqual({
      unreadNotificationsCount: 3,
    });
  });
});
