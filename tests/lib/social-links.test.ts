/**
 * What: Unit tests for the club website and social handle helpers.
 * Why: Clubs type their socials as "@handle", "handle" or a pasted profile URL.
 *      The backend stores whatever it receives, so the form normalizes to a bare
 *      handle and the club page must still build a working link for legacy rows
 *      that hold a full URL. Links must never carry a non-http(s) scheme.
 */
import { describe, it, expect } from "vitest";
import {
  normalizeSocialHandle,
  socialProfileUrl,
  toWebsiteUrl,
} from "@/lib/social-links";

describe("normalizeSocialHandle", () => {
  it.each([
    ["instagram", "hcsanisidro", "hcsanisidro"],
    ["instagram", "@hcsanisidro", "hcsanisidro"],
    ["instagram", "  @hc.san_isidro  ", "hc.san_isidro"],
    ["instagram", "https://www.instagram.com/hcsanisidro/", "hcsanisidro"],
    ["instagram", "instagram.com/hcsanisidro?igsh=abc", "hcsanisidro"],
    ["twitter", "https://x.com/hcsanisidro", "hcsanisidro"],
    ["twitter", "https://twitter.com/@hcsanisidro", "hcsanisidro"],
    ["facebook", "https://m.facebook.com/hc.sanisidro", "hc.sanisidro"],
    ["facebook", "https://www.facebook.com/profile.php?id=1000123", "profile.php?id=1000123"],
    ["tiktok", "https://www.tiktok.com/@hcsanisidro", "hcsanisidro"],
  ] as const)("%s: %s -> %s", (platform, input, expected) => {
    expect(normalizeSocialHandle(platform, input)).toBe(expected);
  });

  it.each([
    ["instagram", ""],
    ["instagram", "   "],
    ["instagram", "@"],
    ["instagram", "hc san isidro"],
    ["instagram", "https://facebook.com/hcsanisidro"],
    ["twitter", "https://x.com/"],
    ["tiktok", "javascript:alert(1)"],
  ] as const)("%s: rejects %j", (platform, input) => {
    expect(normalizeSocialHandle(platform, input)).toBeNull();
  });
});

describe("socialProfileUrl", () => {
  it("builds the profile URL from a stored handle", () => {
    expect(socialProfileUrl("instagram", "hcsanisidro")).toBe(
      "https://instagram.com/hcsanisidro",
    );
    expect(socialProfileUrl("tiktok", "hcsanisidro")).toBe(
      "https://tiktok.com/@hcsanisidro",
    );
  });

  it("rebuilds a clean link from a legacy row that stored a full URL", () => {
    expect(socialProfileUrl("twitter", "https://twitter.com/hcsanisidro")).toBe(
      "https://x.com/hcsanisidro",
    );
  });

  it("returns null for a value that is not a valid handle", () => {
    expect(socialProfileUrl("facebook", "not a handle")).toBeNull();
  });
});

describe("toWebsiteUrl", () => {
  it("keeps an http(s) URL", () => {
    expect(toWebsiteUrl("https://hcsanisidro.com.ar/club")).toBe(
      "https://hcsanisidro.com.ar/club",
    );
  });

  it("adds https:// when the protocol is missing", () => {
    expect(toWebsiteUrl(" hcsanisidro.com.ar ")).toBe("https://hcsanisidro.com.ar");
  });

  it.each(["", "   ", "javascript:alert(1)", "ftp://hcsanisidro.com", "not a site", "localhost"])(
    "rejects %j",
    (input) => {
      expect(toWebsiteUrl(input)).toBeNull();
    },
  );
});
