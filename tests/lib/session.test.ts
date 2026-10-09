/**
 * What: Unit tests for clearClientSession / purgeLegacyStorage.
 * Why: Logout must leave nothing of the previous account behind (query cache,
 *      user stores, persisted keys, socket) so the next person on the same
 *      browser never sees it, even when the network calls fail.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { clearClientSession, purgeLegacyStorage } from "@/lib/session";
import { useAuthStore } from "@/stores/useAuthStore";
import { useOpportunitiesStore } from "@/stores/useOpportunitiesStore";
import { useNotificationsStore } from "@/stores/useNotificationsStore";
import { LOGOUT } from "@/graphql";
import type { JobOpportunity } from "@/types/models/job-opportunity";
import { mockUser } from "../test-utils";

const { requestMock, disconnectSocketMock } = vi.hoisted(() => ({
  requestMock: vi.fn(),
  disconnectSocketMock: vi.fn(),
}));

vi.mock("@/lib/graphql-client", () => ({
  rawGraphqlClient: { request: requestMock },
  graphqlClient: { request: vi.fn() },
}));

vi.mock("@/lib/socket-client", () => ({
  disconnectSocket: disconnectSocketMock,
}));

const fetchMock = vi.fn();

const emptyFilters = {
  level: null,
  status: null,
  country: null,
  positionType: null,
  licenseLevelRequired: null,
  modality: null,
  umpireCategory: null,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function seedPreviousSession() {
  useAuthStore.setState({ user: mockUser, isLoggedIn: true });
  useOpportunitiesStore.setState({
    searchQuery: "goalkeeper",
    filters: { ...emptyFilters, level: "PROFESSIONAL" },
    selectedOpportunity: { id: "job-1" } as JobOpportunity,
    isModalOpen: true,
  });
  useNotificationsStore.setState({ isOpen: true });
  localStorage.setItem("userRole", "coach");
  localStorage.setItem("theme", "dark");
}

function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe("clearClientSession", () => {
  beforeEach(() => {
    requestMock.mockReset().mockResolvedValue({ logout: true });
    disconnectSocketMock.mockReset();
    fetchMock.mockReset().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    useAuthStore.setState({ user: null, isLoggedIn: false });
    useOpportunitiesStore.setState({
      searchQuery: "",
      filters: emptyFilters,
      selectedOpportunity: null,
      isModalOpen: false,
    });
    useNotificationsStore.setState({ isOpen: false });
  });

  it("waits for the LOGOUT mutation before deleting the session cookie", async () => {
    const logoutAnswer = deferred<{ logout: boolean }>();
    requestMock.mockReturnValue(logoutAnswer.promise);

    const done = clearClientSession(createQueryClient());
    await vi.waitFor(() => expect(requestMock).toHaveBeenCalledWith(LOGOUT));

    expect(fetchMock).not.toHaveBeenCalled();

    logoutAnswer.resolve({ logout: true });
    await done;

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/session", { method: "DELETE" });
  });

  it("cancels in-flight queries before clearing the cache", async () => {
    const queryClient = createQueryClient();
    const cancel = vi.spyOn(queryClient, "cancelQueries");
    const clear = vi.spyOn(queryClient, "clear");

    await clearClientSession(queryClient);

    expect(cancel).toHaveBeenCalled();
    expect(clear).toHaveBeenCalled();
    expect(cancel.mock.invocationCallOrder[0]).toBeLessThan(
      clear.mock.invocationCallOrder[0],
    );
  });

  it("empties the React Query cache", async () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(["savedJobs"], { savedJobOpportunities: [] });
    queryClient.setQueryData(["jobOpportunities", undefined], { jobOpportunities: [] });

    await clearClientSession(queryClient);

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it("resets the auth, opportunities and notifications stores", async () => {
    seedPreviousSession();

    await clearClientSession(createQueryClient());

    expect(useAuthStore.getState()).toMatchObject({ user: null, isLoggedIn: false });
    expect(useOpportunitiesStore.getState()).toMatchObject({
      searchQuery: "",
      filters: emptyFilters,
      selectedOpportunity: null,
      isModalOpen: false,
    });
    expect(useNotificationsStore.getState().isOpen).toBe(false);
  });

  it("removes the persisted user keys but keeps theme", async () => {
    seedPreviousSession();
    expect(localStorage.getItem("auth-storage")).not.toBeNull();

    await clearClientSession(createQueryClient());

    expect(localStorage.getItem("auth-storage")).toBeNull();
    expect(localStorage.getItem("userRole")).toBeNull();
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("disconnects the notifications socket", async () => {
    await clearClientSession(createQueryClient());

    expect(disconnectSocketMock).toHaveBeenCalledTimes(1);
  });

  it("still clears everything locally when both network calls fail", async () => {
    seedPreviousSession();
    requestMock.mockRejectedValue(new Error("network down"));
    fetchMock.mockRejectedValue(new Error("offline"));
    const queryClient = createQueryClient();
    queryClient.setQueryData(["savedJobs"], { savedJobOpportunities: [] });

    await expect(clearClientSession(queryClient)).resolves.toBeUndefined();

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(useAuthStore.getState().user).toBeNull();
    expect(localStorage.getItem("auth-storage")).toBeNull();
    expect(disconnectSocketMock).toHaveBeenCalled();
  });

  it("works without a query client", async () => {
    seedPreviousSession();

    await expect(clearClientSession(null)).resolves.toBeUndefined();

    expect(useAuthStore.getState().user).toBeNull();
  });

  it("shares one run between concurrent callers and allows a later run", async () => {
    const queryClient = createQueryClient();

    await Promise.all([clearClientSession(queryClient), clearClientSession(queryClient)]);
    expect(requestMock).toHaveBeenCalledTimes(1);

    await clearClientSession(queryClient);
    expect(requestMock).toHaveBeenCalledTimes(2);
  });
});

describe("purgeLegacyStorage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("drops the old shared saved-jobs key and leaves preferences alone", () => {
    localStorage.setItem("saved-jobs", JSON.stringify({ state: { savedIds: ["job-1"] } }));
    localStorage.setItem("theme", "light");

    purgeLegacyStorage();

    expect(localStorage.getItem("saved-jobs")).toBeNull();
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("does not throw when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() => purgeLegacyStorage()).not.toThrow();
  });
});
