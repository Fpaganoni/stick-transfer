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

  it("shows only the wordmark logo, with a translated alt", () => {
    renderNav();

    const home = navLink("home");
    const logos = within(home).getAllByRole("img", { name: "logoAlt" });
    expect(logos).toHaveLength(1);
    expect(logos[0].getAttribute("src")).toContain("logo-og.png");
    expect(document.querySelector('img[src*="icon-192"]')).toBeNull();
  });

  it("hides the logo link when collapsed but keeps its height so the menu does not jump", () => {
    renderNav({ open: false });

    const home = navLink("home");
    // invisible: not painted, not focusable, out of the a11y tree, space kept
    expect(home).toHaveClass("h-12", "group-data-[collapsible=icon]:invisible");
    // the 99px wordmark must not widen the narrow collapsed rail
    expect(within(home).getByRole("img", { name: "logoAlt" })).toHaveClass(
      "group-data-[collapsible=icon]:hidden",
    );
  });

  it("marks the collapsed state on the sidebar so the icon logo shows", () => {
    const { container } = renderNav({ open: false });

    expect(container.querySelector('[data-collapsible="icon"]')).not.toBeNull();
  });

  it.each([
    ["/profile/edit", "myClub"],
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

    expect(navLink("myClub")).toHaveAttribute("data-active", "false");
  });

  describe("the profile entry", () => {
    it("reads My club for a club account, which IS the club", () => {
      renderNav();

      expect(navLink("myClub")).toHaveAttribute("href", "/profile");
      expect(screen.queryByRole("link", { name: "profile" })).toBeNull();
    });

    it.each([Role.PLAYER, Role.COACH, Role.UMPIRE])("reads Profile for a %s", (role) => {
      state.user = { id: "u1", username: "lucia", role };
      renderNav();

      expect(navLink("profile")).toHaveAttribute("href", "/profile");
      expect(screen.queryByRole("link", { name: "myClub" })).toBeNull();
    });
  });
});
