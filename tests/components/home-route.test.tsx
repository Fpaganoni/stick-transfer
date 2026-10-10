/**
 * What: Tests for the home route (app/[locale]/page.tsx).
 * Why: The home lives outside the (app) route group so visitors get the
 *      server-rendered landing. A signed-in user is sent to /opportunities
 *      (same content they saw at "/"), where the persistent shell mounts once.
 *      proxy.ts redirects most of them before the page loads; this covers a
 *      session whose routing cookie is missing.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/[locale]/page";

const { state, mockReplace } = vi.hoisted(() => ({
  state: { hydrated: true, isLoggedIn: false, locale: "en" },
  mockReplace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: vi.fn() }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => state.locale,
}));

vi.mock("@/hooks/ui/use-auth-hydrated", () => ({
  useAuthHydrated: () => state.hydrated,
}));

vi.mock("@/stores/useAuthStore", () => ({
  useAuthStore: (selector: (s: { isLoggedIn: boolean }) => unknown) =>
    selector({ isLoggedIn: state.isLoggedIn }),
}));

vi.mock("@/components/pages/landing-page", () => ({
  LandingPage: () => <div>landing</div>,
}));

describe("Home route", () => {
  beforeEach(() => {
    state.hydrated = true;
    state.isLoggedIn = false;
    state.locale = "en";
    mockReplace.mockReset();
  });

  it("shows the landing to visitors", () => {
    render(<Home />);

    expect(screen.getByText("landing")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("shows the landing while the auth store is still hydrating", () => {
    state.hydrated = false;
    state.isLoggedIn = true;

    render(<Home />);

    expect(screen.getByText("landing")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("sends a signed-in user to the opportunities, keeping the locale", () => {
    state.isLoggedIn = true;
    state.locale = "es";

    render(<Home />);

    expect(mockReplace).toHaveBeenCalledWith("/es/opportunities");
    expect(screen.queryByText("landing")).not.toBeInTheDocument();
  });
});
