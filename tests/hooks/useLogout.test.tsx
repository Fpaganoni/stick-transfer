/**
 * What: Tests for useLogout, the logout action shared by the header and the
 *       admin shell.
 * Why: The old code fired logout() without awaiting it and hard-reloaded the
 *      page, which could cancel the LOGOUT mutation. The session must be fully
 *      cleared before navigating, and the button must not fire twice.
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useLogout } from "@/hooks/useLogout";

const { replaceMock, clearClientSessionMock, localeState } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  clearClientSessionMock: vi.fn(),
  localeState: { value: "en" },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => localeState.value,
}));

vi.mock("@/lib/session", () => ({ clearClientSession: clearClientSessionMock }));

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function createHarness() {
  const queryClient = new QueryClient();
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { queryClient, Wrapper };
}

describe("useLogout", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    clearClientSessionMock.mockReset().mockResolvedValue(undefined);
    localeState.value = "en";
  });

  it("clears the session with the app query client before navigating", async () => {
    const sessionCleared = deferred();
    clearClientSessionMock.mockReturnValue(sessionCleared.promise);
    const { queryClient, Wrapper } = createHarness();
    const { result } = renderHook(() => useLogout(), { wrapper: Wrapper });

    act(() => {
      void result.current.logout();
    });

    expect(clearClientSessionMock).toHaveBeenCalledWith(queryClient);
    expect(replaceMock).not.toHaveBeenCalled();

    await act(async () => {
      sessionCleared.resolve();
    });

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/"));
  });

  it("navigates to the locale home for non-default locales", async () => {
    localeState.value = "es";
    const { Wrapper } = createHarness();
    const { result } = renderHook(() => useLogout(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(replaceMock).toHaveBeenCalledWith("/es");
  });

  it("reports isLoggingOut while the session is being cleared and ignores a second click", async () => {
    const sessionCleared = deferred();
    clearClientSessionMock.mockReturnValue(sessionCleared.promise);
    const { Wrapper } = createHarness();
    const { result } = renderHook(() => useLogout(), { wrapper: Wrapper });

    expect(result.current.isLoggingOut).toBe(false);

    act(() => {
      void result.current.logout();
    });
    await waitFor(() => expect(result.current.isLoggingOut).toBe(true));

    act(() => {
      void result.current.logout();
    });
    expect(clearClientSessionMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      sessionCleared.resolve();
    });
  });
});
