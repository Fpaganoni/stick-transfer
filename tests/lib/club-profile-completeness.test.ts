import { describe, it, expect } from "vitest";
import { getClubProfileCompleteness } from "@/lib/club-profile-completeness";

describe("getClubProfileCompleteness", () => {
  it("is complete when the crest and the description are present", () => {
    expect(
      getClubProfileCompleteness({ logo: "https://img/crest.png", description: "Founded in 1950" }),
    ).toEqual({ isComplete: true, missing: [] });
  });

  it("reports the missing crest", () => {
    expect(getClubProfileCompleteness({ logo: null, description: "Founded in 1950" })).toEqual({
      isComplete: false,
      missing: ["crest"],
    });
  });

  it("reports the missing description", () => {
    expect(getClubProfileCompleteness({ logo: "https://img/crest.png", description: "" })).toEqual({
      isComplete: false,
      missing: ["description"],
    });
  });

  it("reports both, crest first", () => {
    expect(getClubProfileCompleteness({})).toEqual({
      isComplete: false,
      missing: ["crest", "description"],
    });
  });

  it("treats whitespace-only values as missing", () => {
    expect(getClubProfileCompleteness({ logo: "   ", description: " \n\t " })).toEqual({
      isComplete: false,
      missing: ["crest", "description"],
    });
  });

  it("handles a club that was never loaded", () => {
    expect(getClubProfileCompleteness(null)).toEqual({
      isComplete: false,
      missing: ["crest", "description"],
    });
    expect(getClubProfileCompleteness(undefined).isComplete).toBe(false);
  });
});
