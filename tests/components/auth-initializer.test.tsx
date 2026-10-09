/**
 * What: Tests for AuthInitializer.
 * Why: It reconciles the persisted "logged in" flag with the real session on
 *      every app start: it must drop storage left by older versions, re-arm the
 *      routing cookie only when the backend confirms the session, and wipe the
 *      client session when the backend rejects it.
 */
import { render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { AuthInitializer } from "@/components/auth/auth-initializer";
import { graphqlClient } from "@/lib/graphql-client";
import { useAuthStore } from "@/stores/useAuthStore";
import { mockUser } from "../test-utils";

const { clearClientSessionMock, purgeLegacyStorageMock, useNotificationSocketMock } =
  vi.hoisted(() => ({
    clearClientSessionMock: vi.fn(),
    purgeLegacyStorageMock: vi.fn(),
    useNotificationSocketMock: vi.fn(),
  }));

vi.mock("@/lib/graphql-client");
vi.mock("@/lib/session", () => ({
  clearClientSession: clearClientSessionMock,
  purgeLegacyStorage: purgeLegacyStorageMock,
}));
vi.mock("@/hooks/useNotificationSocket", () => ({
  useNotificationSocket: useNotificationSocketMock,
}));

const fetchMock = vi.fn();

function renderInitializer() {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <AuthInitializer />
    </QueryClientProvider>,
  );
  return queryClient;
}

describe("AuthInitializer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearClientSessionMock.mockResolvedValue(undefined);
    fetchMock.mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    vi.mocked(graphqlClient).request = vi.fn().mockResolvedValue({ me: { id: mockUser.id } });
    useAuthStore.setState({ user: null, isLoggedIn: false });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    useAuthStore.setState({ user: null, isLoggedIn: false });
  });

  it("removes storage written by older versions once on start", async () => {
    renderInitializer();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    act(() => useAuthStore.setState({ user: mockUser, isLoggedIn: true }));
    await waitFor(() => expect(graphqlClient.request).toHaveBeenCalled());

    expect(purgeLegacyStorageMock).toHaveBeenCalledTimes(1);
  });

  it("starts the notifications socket hook", async () => {
    renderInitializer();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    expect(useNotificationSocketMock).toHaveBeenCalled();
  });

  it("only clears the routing cookie when nobody is logged in", async () => {
    renderInitializer();

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/auth/session", { method: "DELETE" }),
    );
    expect(graphqlClient.request).not.toHaveBeenCalled();
    expect(clearClientSessionMock).not.toHaveBeenCalled();
  });

  it("re-arms the routing cookie when the backend confirms the session", async () => {
    useAuthStore.setState({ user: mockUser, isLoggedIn: true });

    renderInitializer();

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/auth/session", { method: "POST" }),
    );
    expect(clearClientSessionMock).not.toHaveBeenCalled();
  });

  it("clears the whole client session when the backend rejects the stored one", async () => {
    useAuthStore.setState({ user: mockUser, isLoggedIn: true });
    vi.mocked(graphqlClient).request = vi.fn().mockRejectedValue(new Error("expired"));

    const queryClient = renderInitializer();

    await waitFor(() => expect(clearClientSessionMock).toHaveBeenCalledWith(queryClient));
    expect(fetchMock).not.toHaveBeenCalledWith("/api/auth/session", { method: "POST" });
  });
});
