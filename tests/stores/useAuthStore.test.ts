/**
 * What: Unit tests for useAuthStore (Zustand + persist).
 * Why: Auth state is the trust boundary for the entire app. Critical to verify
 *      login/logout transitions, updateUser partial-merge safety, and that
 *      the persist key is stable (changing it would log out all users in prod).
 */
import { describe, it, expect, beforeEach } from "vitest";
import { act } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { mockUser } from "../test-utils";
import { QueryClient } from "@tanstack/react-query";
import { registerQueryClient } from "@/lib/query-client-registry";

// Reset store between tests (bypasses zustand persist caching)
function resetStore() {
  useAuthStore.setState({ user: null, isLoggedIn: false });
}

describe("useAuthStore", () => {
  beforeEach(resetStore);

  it("starts with unauthenticated state", () => {
    const { user, isLoggedIn } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(isLoggedIn).toBe(false);
  });

  it("login() sets user and flips isLoggedIn", async () => {
    await act(async () => useAuthStore.getState().login(mockUser));
    const { user, isLoggedIn } = useAuthStore.getState();
    expect(user).toMatchObject({ id: "user-1", email: "franco@test.com" });
    expect(isLoggedIn).toBe(true);
  });

  it("logout() clears user and resets isLoggedIn", async () => {
    await act(async () => {
      await useAuthStore.getState().login(mockUser);
    });
    act(() => useAuthStore.getState().logout());
    const { user, isLoggedIn } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(isLoggedIn).toBe(false);
  });

  it("logout() removes the persisted auth-storage entry, not just the in-memory user", async () => {
    await act(async () => {
      await useAuthStore.getState().login(mockUser);
    });
    expect(localStorage.getItem("auth-storage")).toContain("franco@test.com");

    act(() => useAuthStore.getState().logout());

    expect(localStorage.getItem("auth-storage")).toBeNull();
  });

  describe("login() when another account was active", () => {
    const otherUser = { ...mockUser, id: "user-2", email: "other@test.com" };

    function createRegisteredClient() {
      const queryClient = new QueryClient();
      queryClient.setQueryData(["savedJobs"], { savedJobOpportunities: [{ id: "job-1" }] });
      registerQueryClient(queryClient);
      return queryClient;
    }

    it("clears the query cache before setting the new user", async () => {
      const queryClient = createRegisteredClient();
      useAuthStore.setState({ user: mockUser, isLoggedIn: true });

      await act(async () => useAuthStore.getState().login(otherUser));

      expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
      expect(useAuthStore.getState().user?.id).toBe("user-2");
    });

    it("keeps the cache when the same account logs in again", async () => {
      const queryClient = createRegisteredClient();
      useAuthStore.setState({ user: mockUser, isLoggedIn: true });

      await act(async () => useAuthStore.getState().login(mockUser));

      expect(queryClient.getQueryCache().getAll()).toHaveLength(1);
    });

    it("keeps the cache when there was no previous user", async () => {
      const queryClient = createRegisteredClient();

      await act(async () => useAuthStore.getState().login(otherUser));

      expect(queryClient.getQueryCache().getAll()).toHaveLength(1);
    });
  });

  it("updateUser() merges partial data without overwriting unrelated fields", async () => {
    await act(async () => {
      await useAuthStore.getState().login(mockUser);
      useAuthStore.getState().updateUser({ bio: "Plays left wing" });
    });
    const { user } = useAuthStore.getState();
    // Merge: bio updated, original name preserved
    expect(user?.bio).toBe("Plays left wing");
    expect(user?.name).toBe("Franco Test");
  });

  it("updateUser() is a no-op when user is null (prevents runtime crash)", () => {
    act(() => useAuthStore.getState().updateUser({ bio: "Should not apply" }));
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("register() sets user without marking isLoggedIn (registration ≠ login)", () => {
    act(() => useAuthStore.getState().register(mockUser));
    const { user, isLoggedIn } = useAuthStore.getState();
    expect(user).toMatchObject({ id: "user-1" });
    // Registration alone should not grant a session
    expect(isLoggedIn).toBe(false);
  });
});
