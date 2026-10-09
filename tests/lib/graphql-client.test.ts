/**
 * What: Tests for the UNAUTHENTICATED interceptor in lib/graphql-client.
 * Why: An expired session must clear the whole client session exactly once
 *      (several requests fail together), only when someone was logged in, and
 *      must never recurse through the LOGOUT mutation itself.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { ClientError } from "graphql-request";
import { graphqlClient } from "@/lib/graphql-client";
import { registerQueryClient } from "@/lib/query-client-registry";
import { useAuthStore } from "@/stores/useAuthStore";
import { mockUser } from "../test-utils";

const { requestMock, clearClientSessionMock, toastErrorMock } = vi.hoisted(() => ({
  requestMock: vi.fn(),
  clearClientSessionMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock("graphql-request", async (importOriginal) => {
  const actual = await importOriginal<typeof import("graphql-request")>();
  return {
    ...actual,
    GraphQLClient: class {
      request = requestMock;
    },
  };
});

vi.mock("@/lib/session", () => ({ clearClientSession: clearClientSessionMock }));
vi.mock("sonner", () => ({ toast: { error: toastErrorMock } }));

function unauthenticatedError() {
  return new ClientError(
    {
      status: 200,
      errors: [{ message: "Unauthorized", extensions: { code: "UNAUTHENTICATED" } }],
    } as never,
    { query: "query { me { id } }" },
  );
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("graphqlClient UNAUTHENTICATED handling", () => {
  const queryClient = new QueryClient();

  beforeEach(() => {
    requestMock.mockReset();
    clearClientSessionMock.mockReset().mockResolvedValue(undefined);
    toastErrorMock.mockReset();
    registerQueryClient(queryClient);
    useAuthStore.setState({ user: mockUser, isLoggedIn: true });
    // jsdom cannot navigate; the redirect after the toast logs a "not implemented" error.
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null, isLoggedIn: false });
  });

  it("clears the client session with the registered query client and warns the user", async () => {
    const error = unauthenticatedError();
    requestMock.mockRejectedValue(error);

    await expect(graphqlClient.request("query { me { id } }")).rejects.toBe(error);

    await vi.waitFor(() => expect(toastErrorMock).toHaveBeenCalledTimes(1));
    expect(clearClientSessionMock).toHaveBeenCalledWith(queryClient);
  });

  it("handles several simultaneous failures only once", async () => {
    const sessionCleared = deferred();
    clearClientSessionMock.mockReturnValue(sessionCleared.promise);
    requestMock.mockRejectedValue(unauthenticatedError());

    await Promise.allSettled([
      graphqlClient.request("query { me { id } }"),
      graphqlClient.request("query { savedJobOpportunities { id } }"),
      graphqlClient.request("query { jobOpportunities { id } }"),
    ]);
    sessionCleared.resolve();

    await vi.waitFor(() => expect(toastErrorMock).toHaveBeenCalledTimes(1));
    expect(clearClientSessionMock).toHaveBeenCalledTimes(1);
  });

  it("still logs the user out locally when the session cleanup itself fails", async () => {
    clearClientSessionMock.mockRejectedValue(new Error("chunk failed to load"));
    requestMock.mockRejectedValue(unauthenticatedError());

    await expect(graphqlClient.request("query { me { id } }")).rejects.toBeInstanceOf(
      ClientError,
    );

    await vi.waitFor(() => expect(useAuthStore.getState().isLoggedIn).toBe(false));
  });

  it("ignores UNAUTHENTICATED answers when nobody is logged in", async () => {
    useAuthStore.setState({ user: null, isLoggedIn: false });
    const error = unauthenticatedError();
    requestMock.mockRejectedValue(error);

    await expect(graphqlClient.request("mutation { login }")).rejects.toBe(error);

    expect(clearClientSessionMock).not.toHaveBeenCalled();
    expect(toastErrorMock).not.toHaveBeenCalled();
  });

  it("rethrows other errors without touching the session", async () => {
    const error = new Error("boom");
    requestMock.mockRejectedValue(error);

    await expect(graphqlClient.request("query { me { id } }")).rejects.toBe(error);

    expect(clearClientSessionMock).not.toHaveBeenCalled();
  });
});
