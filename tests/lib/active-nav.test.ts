/**
 * What: Unit tests for the side navigation active-item resolver.
 * Why: The sidebar only matched exact paths, so /profile/edit or /clubs/<id>
 *      left nothing highlighted. Prefix matching must still pick one item:
 *      /opportunities/new is "Post a job", not also "Opportunities", and a
 *      public profile of someone else is not "my profile".
 */
import { describe, it, expect } from "vitest";
import { getActiveNavHref } from "@/lib/active-nav";

const HREFS = [
  "/opportunities",
  "/opportunities/new",
  "/explore",
  "/clubs",
  "/news",
  "/messages",
  "/profile",
];

describe("getActiveNavHref", () => {
  it.each([
    ["/opportunities", "/opportunities"],
    ["/es/opportunities", "/opportunities"],
    ["/opportunities/new", "/opportunities/new"],
    ["/fr/opportunities/new", "/opportunities/new"],
    ["/clubs/08317e2d", "/clubs"],
    ["/es/clubs/08317e2d", "/clubs"],
    ["/news/some-article", "/news"],
    ["/profile", "/profile"],
    ["/profile/edit", "/profile"],
    ["/es/profile/edit", "/profile"],
    ["/profile/admin_san_isidro", "/profile"],
    ["/profile/john/doe", null],
    ["/profile/someone_else", null],
    ["/", "/opportunities"],
    ["/es", "/opportunities"],
    ["/clubsfake", null],
    ["/settings", null],
  ])("%s -> %s", (pathname, expected) => {
    expect(getActiveNavHref(pathname, HREFS, "admin_san_isidro")).toBe(expected);
  });

  it("treats a dotted username split in segments as the own profile", () => {
    expect(getActiveNavHref("/profile/john/doe", HREFS, "john.doe")).toBe("/profile");
  });

  it("does not mark a public profile when the username is unknown", () => {
    expect(getActiveNavHref("/profile/admin_san_isidro", HREFS, undefined)).toBeNull();
  });

  it("falls back to Opportunities when post-a-job is not in the menu", () => {
    const withoutPostJob = HREFS.filter((href) => href !== "/opportunities/new");
    expect(getActiveNavHref("/opportunities/new", withoutPostJob, undefined)).toBe(
      "/opportunities",
    );
  });
});
