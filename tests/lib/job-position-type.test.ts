/**
 * What: Unit tests for the job position type helpers and match date formatter.
 * Why: The backend only accepts PLAYER/COACH/STAFF/UMPIRE/OTHER and answers
 *      anything else with a 400; legacy rows can still hold free-text values,
 *      and match dates may arrive as ISO strings or ms timestamps.
 */
import { describe, it, expect } from "vitest";
import {
  POSITION_TYPES,
  isUmpireJob,
  getPositionTypeLabel,
} from "@/lib/job-position-type";
import { formatMatchDate } from "@/lib/format-match-date";

describe("POSITION_TYPES", () => {
  it("matches the backend enum exactly", () => {
    expect([...POSITION_TYPES]).toEqual(["PLAYER", "COACH", "STAFF", "UMPIRE", "OTHER"]);
  });
});

describe("isUmpireJob", () => {
  it.each(["UMPIRE", "umpire", "Umpire"])("is true for %s", (value) => {
    expect(isUmpireJob(value)).toBe(true);
  });

  it.each(["PLAYER", "COACH", "", null, undefined, "Umpires"])(
    "is false for %s",
    (value) => {
      expect(isUmpireJob(value as string | null | undefined)).toBe(false);
    },
  );
});

describe("getPositionTypeLabel", () => {
  const t = (key: string) => `T:${key}`;

  it("translates known types", () => {
    expect(getPositionTypeLabel(t, "UMPIRE")).toBe("T:positionTypes.UMPIRE");
    expect(getPositionTypeLabel(t, "STAFF")).toBe("T:positionTypes.STAFF");
  });

  it("is case-insensitive", () => {
    expect(getPositionTypeLabel(t, "umpire")).toBe("T:positionTypes.UMPIRE");
  });

  it("shows legacy free-text values untouched", () => {
    expect(getPositionTypeLabel(t, "Goalkeeper")).toBe("Goalkeeper");
    expect(getPositionTypeLabel(t, "Full-Time")).toBe("Full-Time");
  });

  it("returns an empty string when there is no value", () => {
    expect(getPositionTypeLabel(t, null)).toBe("");
    expect(getPositionTypeLabel(t, undefined)).toBe("");
    expect(getPositionTypeLabel(t, "")).toBe("");
  });
});

describe("formatMatchDate", () => {
  it("formats an ISO string", () => {
    const out = formatMatchDate("2026-11-15T10:00:00Z", "en");
    expect(out).toMatch(/2026/);
    expect(out).toMatch(/Nov/);
  });

  it("formats a ms timestamp the same as its ISO equivalent", () => {
    const iso = "2026-11-15T10:00:00Z";
    expect(formatMatchDate(String(Date.parse(iso)), "en")).toBe(formatMatchDate(iso, "en"));
  });

  it("follows the locale", () => {
    expect(formatMatchDate("2026-11-15T10:00:00Z", "es")).toMatch(/nov/i);
  });

  it.each([null, undefined, "", "garbage"])("returns '' for %s", (value) => {
    expect(formatMatchDate(value as string | null | undefined, "en")).toBe("");
  });
});
