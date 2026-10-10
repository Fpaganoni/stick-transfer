/**
 * What: Tests for the persistent AppShell (rendered once by app/[locale]/(app)/layout.tsx).
 * Why: The shell used to be mounted inside every page, so each navigation
 *      reset its hydration flag and flashed a full-screen spinner. It now lives
 *      in a layout: navigating swaps only the children, the title follows the
 *      pathname, and while the auth store hydrates the sidebar and header stay
 *      on screen with placeholders instead of a spinner.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Role } from "@/types/enums";

const { nav, authState, mockReplace, sidebarMounts } = vi.hoisted(() => ({
  nav: { pathname: "/opportunities" },
  authState: {
    hydrated: true,
    user: { id: "u1", username: "lucia", role: "PLAYER" } as {
      id: string;
      username: string;
      role: string;
    } | null,
  },
  mockReplace: vi.fn(),
  sidebarMounts: { count: 0 },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ replace: mockReplace, push: vi.fn() }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("@/hooks/ui/use-auth-hydrated", () => ({
  useAuthHydrated: () => authState.hydrated,
}));

vi.mock("@/stores/useAuthStore", () => ({
  useAuthStore: (selector?: (state: { user: typeof authState.user }) => unknown) =>
    selector ? selector({ user: authState.user }) : { user: authState.user },
}));

vi.mock("@/components/layout/side-navigation", () => ({
  SideNavigation: () => {
    useEffect(() => {
      sidebarMounts.count += 1;
    }, []);
    return <nav aria-label="sidebar" />;
  },
}));

vi.mock("@/components/layout/header", () => ({
  Header: ({ title, isLoadingUser }: { title: string; isLoadingUser?: boolean }) => (
    <header>
      <h1>{title}</h1>
      {isLoadingUser && <span aria-label="loading-user" />}
    </header>
  ),
}));

vi.mock("@/components/ui/sidebar", () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarInset: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("AppShell", () => {
  beforeEach(() => {
    nav.pathname = "/opportunities";
    authState.hydrated = true;
    authState.user = { id: "u1", username: "lucia", role: Role.PLAYER };
    mockReplace.mockReset();
    sidebarMounts.count = 0;
  });

  it("keeps the sidebar mounted and shows no spinner when the route changes", () => {
    const { rerender } = render(
      <AppShell>
        <p>opportunities page</p>
      </AppShell>,
    );

    nav.pathname = "/explore";
    rerender(
      <AppShell>
        <p>explore page</p>
      </AppShell>,
    );

    expect(screen.getByText("explore page")).toBeInTheDocument();
    expect(sidebarMounts.count).toBe(1);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("takes the header title from the pathname", () => {
    const { rerender } = render(<AppShell>page</AppShell>);
    expect(screen.getByRole("heading")).toHaveTextContent("opportunities.availablePositions");

    nav.pathname = "/es/clubs";
    rerender(<AppShell>page</AppShell>);

    expect(screen.getByRole("heading")).toHaveTextContent("clubs.title");
  });

  it("renders the sidebar and header with placeholders while the store hydrates", () => {
    authState.hydrated = false;

    render(
      <AppShell>
        <p>page content</p>
      </AppShell>,
    );

    expect(screen.getByRole("navigation", { name: "sidebar" })).toBeInTheDocument();
    expect(screen.getByLabelText("loading-user")).toBeInTheDocument();
    expect(screen.getByLabelText("loading")).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText("page content")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("sends a SUPERADMIN to /admin without rendering the page", () => {
    authState.user = { id: "a1", username: "admin", role: Role.SUPERADMIN };

    render(
      <AppShell>
        <p>page content</p>
      </AppShell>,
    );

    expect(mockReplace).toHaveBeenCalledWith("/admin");
    expect(screen.queryByText("page content")).not.toBeInTheDocument();
  });
});
