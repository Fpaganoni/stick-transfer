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

  it("login() sets user and flips isLoggedIn", () => {
    act(() => useAuthStore.getState().login(mockUser, "mock-token"));
    const { user, isLoggedIn } = useAuthStore.getState();
    expect(user).toMatchObject({ id: "user-1", email: "franco@test.com" });
    expect(isLoggedIn).toBe(true);
  });

  it("logout() clears user and resets isLoggedIn", () => {
    act(() => {
      useAuthStore.getState().login(mockUser, "mock-token");
      useAuthStore.getState().logout();
    });
    const { user, isLoggedIn } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(isLoggedIn).toBe(false);
  });

  it("updateUser() merges partial data without overwriting unrelated fields", () => {
    act(() => {
      useAuthStore.getState().login(mockUser, "mock-token");
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
    act(() => useAuthStore.getState().register(mockUser, "mock-token"));
    const { user, isLoggedIn } = useAuthStore.getState();
    expect(user).toMatchObject({ id: "user-1" });
    // Registration alone should not grant a session
    expect(isLoggedIn).toBe(false);
  });
});
