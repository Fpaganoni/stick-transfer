/**
 * What: Tests for usePageTitle, the header title of the persistent AppShell.
 * Why: Each page used to pass its own title to a shell it mounted itself. With
 *      the shell in a layout the title comes from the pathname instead, with or
 *      without a locale prefix, and the own public profile reads "My Profile".
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePageTitle } from "@/hooks/usePageTitle";

const { nav, authState } = vi.hoisted(() => ({
  nav: { pathname: "/opportunities" },
  authState: { username: "lucia" as string | undefined },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/stores/useAuthStore", () => ({
  useAuthStore: (selector: (state: { user: { username?: string } | null }) => unknown) =>
    selector({ user: authState.username ? { username: authState.username } : null }),
}));

function titleFor(pathname: string) {
  nav.pathname = pathname;
  return renderHook(() => usePageTitle()).result.current;
}

describe("usePageTitle", () => {
  beforeEach(() => {
    authState.username = "lucia";
  });

  it.each([
    ["/opportunities", "opportunities.availablePositions"],
    ["/es/opportunities", "opportunities.availablePositions"],
    ["/fr/opportunities/new", "opportunities.create.title"],
    ["/explore", "pageTitles.explore"],
    ["/clubs", "clubs.title"],
    ["/en/clubs/club-42", "pageTitles.club"],
    ["/news", "news.pageTitle"],
    ["/news/some-article", "news.pageTitle"],
    ["/messages", "pageTitles.messages"],
    ["/profile", "pageTitles.profile"],
    ["/es/profile/edit", "pageTitles.editProfile"],
    ["/somewhere-else", "pageTitles.default"],
  ])("maps %s to %s", (pathname, expected) => {
    expect(titleFor(pathname)).toBe(expected);
  });

  it("shows the username on someone else's public profile", () => {
    expect(titleFor("/es/profile/maria.lopez")).toBe("maria.lopez");
  });

  it("reads 'My Profile' on the own public profile", () => {
    expect(titleFor("/profile/lucia")).toBe("pageTitles.myProfile");
  });

  it("decodes encoded usernames", () => {
    expect(titleFor("/profile/jos%C3%A9")).toBe("josé");
  });
});
