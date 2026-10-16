/**
 * What: Tests for getLevelLabel, the label of the level of a vacancy.
 * Why: The level reached the screen as the raw enum ("PROFESSIONAL"), in English
 *      whatever the language. Known levels are translated; an unexpected stored value
 *      is shown as it is rather than as a missing translation.
 */
import { describe, it, expect } from "vitest";
import { getLevelLabel } from "@/lib/job-level";

const t = (key: string) => `t:${key}`;

describe("getLevelLabel", () => {
  it.each(["PROFESSIONAL", "AMATEUR"])("translates %s", (level) => {
    expect(getLevelLabel(t, level)).toBe(`t:filters.levels.${level}`);
  });

  it("is case-insensitive: older opportunities keep the stored casing", () => {
    expect(getLevelLabel(t, "professional")).toBe("t:filters.levels.PROFESSIONAL");
    expect(getLevelLabel(t, "Amateur")).toBe("t:filters.levels.AMATEUR");
  });

  it("shows an unexpected value as it is instead of a missing translation", () => {
    expect(getLevelLabel(t, "SEMI_PRO")).toBe("SEMI_PRO");
  });

  it("is empty when there is no level", () => {
    expect(getLevelLabel(t, undefined)).toBe("");
    expect(getLevelLabel(t, null)).toBe("");
    expect(getLevelLabel(t, "")).toBe("");
  });
});
