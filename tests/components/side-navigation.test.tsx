/**
 * What: Tests for the side navigation logo and active item.
 * Why: Collapsed, the wide logo (828x301) was forced into 32x32 and vanished;
 *      swapping it from JS state also jumped on hydration. Both logos are now in
 *      the markup and CSS (group-data-[collapsible=icon]) picks one. The active
 *      item must also follow sub-routes such as /profile/edit or /clubs/<id>.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { SideNavigation } from "@/components/layout/side-navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Role } from "@/types/enums";

const { state } = vi.hoisted(() => ({
  state: {
    pathname: "/opportunities",
    user: { id: "club-1", username: "admin_san_isidro", role: "CLUB" } as {
      id: string;
      username: string;
      role: string;
    } | null,
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => state.pathname,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("@/hooks/useRole", () => ({
  useRole: () => ({ isClub: state.user?.role === Role.CLUB, isLoading: false }),
}));

vi.mock("@/hooks/ui/use-auth-hydrated", () => ({
  useAuthHydrated: () => true,
}));

vi.mock("@/stores/useAuthStore", () => ({
  useAuthStore: (selector: (s: { user: typeof state.user }) => unknown) =>
    selector({ user: state.user }),
}));

function renderNav({ open = true } = {}) {
  return render(
    <SidebarProvider defaultOpen={open}>
      <SideNavigation />
    </SidebarProvider>,
  );
}

function navLink(name: string) {
  return screen.getByRole("link", { name });
}

describe("SideNavigation", () => {
  beforeEach(() => {
    state.pathname = "/opportunities";
    state.user = { id: "club-1", username: "admin_san_isidro", role: Role.CLUB };
  });

  it("renders both logos with a translated alt and lets CSS pick one", () => {
    renderNav({ open: false });

    const home = navLink("home");
    const [icon, wordmark] = within(home).getAllByRole("img", { name: "logoAlt" });
    expect(icon.getAttribute("src")).toContain("icon-192.png");
    expect(icon).toHaveClass("hidden", "group-data-[collapsible=icon]:block");
    expect(wordmark.getAttribute("src")).toContain("logo-og.png");
    expect(wordmark).toHaveClass("group-data-[collapsible=icon]:hidden");
  });

  it("marks the collapsed state on the sidebar so the icon logo shows", () => {
    const { container } = renderNav({ open: false });

    expect(container.querySelector('[data-collapsible="icon"]')).not.toBeNull();
  });

  it.each([
    ["/profile/edit", "profile"],
    ["/clubs/08317e2d", "clubs"],
    ["/es/news/some-article", "news"],
    ["/opportunities/new", "postJob"],
  ])("marks the item active on the sub-route %s", (pathname, label) => {
    state.pathname = pathname;
    renderNav();

    const active = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("data-active") === "true");
    expect(active).toEqual([navLink(label)]);
  });

  it("does not mark Profile on another user's public profile", () => {
    state.pathname = "/profile/someone_else";
    renderNav();

    expect(navLink("profile")).toHaveAttribute("data-active", "false");
  });
});
