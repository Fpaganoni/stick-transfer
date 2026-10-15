/**
 * What: Tests for the user block of the app Header.
 * Why: For a CLUB account user.name is the club name and user.avatar is the
 *      crest. A person's avatar is a round photo, but a crest cropped to a
 *      circle loses its shield, so a club is drawn whole in a rounded box.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Header } from "@/components/layout/header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Role } from "@/types/enums";

const { state } = vi.hoisted(() => ({
  state: {
    user: null as { name: string; avatar?: string; role: string } | null,
  },
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("@/stores/useAuthStore", () => ({
  useAuthStore: () => ({ user: state.user }),
}));

vi.mock("@/hooks/useLogout", () => ({
  useLogout: () => ({ logout: vi.fn(), isLoggingOut: false }),
}));

vi.mock("@/stores/useNotificationsStore", () => ({
  useNotificationsStore: () => ({ isOpen: false, toggle: vi.fn() }),
}));

vi.mock("@/hooks/useNotifications", () => ({
  useUnreadNotificationsCount: () => ({ data: { unreadNotificationsCount: 0 } }),
}));

vi.mock("@/components/notifications/NotificationDropdown", () => ({
  NotificationDropdown: () => null,
}));
vi.mock("@/components/ui/language-selector", () => ({ LanguageSelector: () => null }));
vi.mock("@/components/ui/theme-provider", () => ({ ThemeToggleControl: () => null }));

function renderHeader() {
  return render(
    <SidebarProvider>
      <Header title="Title" />
    </SidebarProvider>,
  );
}

describe("Header user block", () => {
  beforeEach(() => {
    state.user = null;
  });

  it("shows a club by its name and its whole crest, not a round photo", () => {
    state.user = {
      name: "HC Madrid",
      avatar: "https://res.cloudinary.com/demo/crest.png",
      role: Role.CLUB,
    };

    renderHeader();

    expect(screen.getByText("HC Madrid")).toBeInTheDocument();
    const crest = screen.getByRole("img", { name: "HC Madrid" });
    expect(crest).toHaveClass("object-contain");
    expect(crest.parentElement).not.toHaveClass("rounded-full");
    expect(document.querySelector('[data-slot="avatar"]')).toBeNull();
  });

  it("shows the club initial while a new club has no crest", () => {
    state.user = { name: "HC Madrid", avatar: "", role: Role.CLUB };

    renderHeader();

    expect(screen.getByRole("img", { name: "HC Madrid" })).toHaveTextContent("H");
  });

  it("keeps the round avatar for a person", () => {
    state.user = { name: "Lucia Jimenez", avatar: "", role: Role.PLAYER };

    renderHeader();

    expect(screen.getByText("Lucia Jimenez")).toBeInTheDocument();
    expect(document.querySelector('[data-slot="avatar"]')).toHaveClass("rounded-full");
    expect(screen.getByText("L")).toBeInTheDocument();
  });
});
