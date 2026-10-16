/**
 * What: Tests for the rule that decides whether a club may publish vacancies.
 * Why: The backend answers CLUB_NOT_VERIFIED to anything but a VERIFIED club (a
 *      PENDING document is not enough). The UI mirrors that rule so the club is told
 *      before it fills in a form, but the backend stays the source of truth.
 */
import { describe, it, expect } from "vitest";
import { canPublishVacancies } from "@/lib/club-publishing";

describe("canPublishVacancies", () => {
  it("lets a VERIFIED club publish", () => {
    expect(canPublishVacancies("VERIFIED")).toBe(true);
  });

  it.each(["UNVERIFIED", "PENDING", "REJECTED"])("does not let a %s club publish", (status) => {
    expect(canPublishVacancies(status)).toBe(false);
  });

  it("does not let a club publish while its status is unknown", () => {
    expect(canPublishVacancies(undefined)).toBe(false);
    expect(canPublishVacancies(null)).toBe(false);
  });

  it("does not guess: an unexpected value is not a verification", () => {
    expect(canPublishVacancies("verified")).toBe(false);
    expect(canPublishVacancies("")).toBe(false);
  });
});
