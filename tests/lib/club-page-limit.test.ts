/**
 * What: Tests for the rule that says a club list may have been cut at the page limit.
 * Why: The backend returns at most one page (100). A list that comes back full may have
 *      more rows behind it, and the owner must not read it as "this is everything".
 */
import { describe, it, expect } from "vitest";
import { CLUB_PAGE_LIMIT, mayBeTruncated } from "@/lib/club-page-limit";

describe("mayBeTruncated", () => {
  it("uses the page size the backend caps club lists at", () => {
    expect(CLUB_PAGE_LIMIT).toBe(100);
  });

  it("is false below the limit", () => {
    expect(mayBeTruncated(0)).toBe(false);
    expect(mayBeTruncated(CLUB_PAGE_LIMIT - 1)).toBe(false);
  });

  it("is true when the page came back full, because there may be more behind it", () => {
    expect(mayBeTruncated(CLUB_PAGE_LIMIT)).toBe(true);
  });
});
