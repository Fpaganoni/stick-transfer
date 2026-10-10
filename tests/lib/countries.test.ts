/**
 * What: Unit tests for the country helpers (codes, names, flags, sorting).
 * Why: The backend stores countries as ISO 3166-1 alpha-2 codes plus GB-ENG,
 *      GB-SCT and GB-WLS and rejects anything else with COUNTRY_INVALID. Every
 *      selector and every place that shows a country reads from this module,
 *      so a wrong code, name or flag here shows up across the whole app.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  COUNTRY_CODES,
  FEATURED_HOCKEY_COUNTRIES,
  UK_HOME_NATIONS,
  normalizeCountry,
  isCountryCode,
  getCountryName,
  getCountryFlag,
  sortCountriesByName,
} from "@/lib/countries";

describe("COUNTRY_CODES", () => {
  it("mirrors the backend list: 249 ISO codes plus the 3 UK home nations", () => {
    expect(COUNTRY_CODES).toHaveLength(252);
    expect(new Set(COUNTRY_CODES).size).toBe(252);
    expect(COUNTRY_CODES).toEqual(expect.arrayContaining(["AR", "GB", ...UK_HOME_NATIONS]));
  });

  it("only holds uppercase codes in the formats the API accepts", () => {
    const invalid = COUNTRY_CODES.filter((c) => !/^([A-Z]{2}|GB-(ENG|SCT|WLS))$/.test(c));
    expect(invalid).toEqual([]);
  });

  it("features the 28 hockey countries, all of them valid codes", () => {
    expect(FEATURED_HOCKEY_COUNTRIES).toHaveLength(28);
    expect(new Set(FEATURED_HOCKEY_COUNTRIES).size).toBe(28);
    expect(FEATURED_HOCKEY_COUNTRIES.filter((c) => !COUNTRY_CODES.includes(c))).toEqual([]);
    expect(FEATURED_HOCKEY_COUNTRIES).toEqual(
      expect.arrayContaining(["AR", "NL", "GB-ENG", "GB-SCT", "GB-WLS", "US"]),
    );
  });
});

describe("normalizeCountry / isCountryCode", () => {
  it.each([
    ["AR", "AR"],
    [" ar ", "AR"],
    ["gb-eng", "GB-ENG"],
  ])("normalizes %j to %s", (input, expected) => {
    expect(normalizeCountry(input)).toBe(expected);
    expect(isCountryCode(input)).toBe(true);
  });

  it.each(["Argentina", "XX", "GB-NIR", "", "   ", null, undefined])(
    "returns null for %j",
    (input) => {
      expect(normalizeCountry(input)).toBeNull();
      expect(isCountryCode(input)).toBe(false);
    },
  );
});

describe("getCountryName", () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([
    ["en", "Argentina", "Germany"],
    ["es", "Argentina", "Alemania"],
    ["fr", "Argentine", "Allemagne"],
  ])("names countries in %s", (locale, argentina, germany) => {
    expect(getCountryName("AR", locale)).toBe(argentina);
    expect(getCountryName("DE", locale)).toBe(germany);
  });

  it("accepts any capitalization of a code", () => {
    expect(getCountryName("es", "en")).toBe("Spain");
  });

  it("uses the translated override for UK home nations", () => {
    expect(getCountryName("GB-ENG", "es", { "GB-ENG": "Inglaterra" })).toBe("Inglaterra");
    expect(getCountryName("gb-sct", "fr", { "GB-SCT": "Écosse" })).toBe("Écosse");
  });

  it("falls back to the English name of a home nation without an override", () => {
    expect(getCountryName("GB-ENG", "es")).toBe("England");
    expect(getCountryName("GB-WLS", "en", {})).toBe("Wales");
  });

  it("shows a legacy value that is not a known code as it is", () => {
    expect(getCountryName("Argentina", "fr")).toBe("Argentina");
    expect(getCountryName("🇪🇸 España", "en")).toBe("🇪🇸 España");
  });

  it("returns an empty string when there is no country", () => {
    expect(getCountryName(null, "en")).toBe("");
    expect(getCountryName(undefined, "en")).toBe("");
    expect(getCountryName("", "en")).toBe("");
  });

  it("builds one Intl.DisplayNames per locale and reuses it", () => {
    const spy = vi.spyOn(Intl, "DisplayNames");

    getCountryName("AR", "pt");
    getCountryName("BR", "pt");
    getCountryName("ES", "pt");

    expect(spy.mock.calls.length).toBeLessThanOrEqual(1);
  });
});

describe("getCountryFlag", () => {
  it("builds the regional-indicator flag of an ISO code", () => {
    expect(getCountryFlag("AR")).toBe("🇦🇷");
    expect(getCountryFlag("es")).toBe("🇪🇸");
  });

  it("builds the tag-sequence flag of a UK home nation", () => {
    expect(getCountryFlag("GB-ENG")).toBe("\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}");
    expect(getCountryFlag("GB-SCT")).toBe("\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}");
  });

  it("returns null for anything that is not a known code", () => {
    expect(getCountryFlag("Argentina")).toBeNull();
    expect(getCountryFlag("XX")).toBeNull();
    expect(getCountryFlag(undefined)).toBeNull();
  });
});

describe("sortCountriesByName", () => {
  it("orders codes by their name in the given locale", () => {
    expect(sortCountriesByName(["ES", "DE", "AR"], "en")).toEqual(["AR", "DE", "ES"]);
    // Alemania, Argentina, España
    expect(sortCountriesByName(["ES", "AR", "DE"], "es")).toEqual(["DE", "AR", "ES"]);
  });

  it("uses the home nation overrides when sorting", () => {
    const names = { "GB-ENG": "Inglaterra" };
    // España, Inglaterra, Irlanda
    expect(sortCountriesByName(["IE", "GB-ENG", "ES"], "es", names)).toEqual(["ES", "GB-ENG", "IE"]);
  });

  it("does not mutate its input", () => {
    const input = ["ES", "AR"];
    sortCountriesByName(input, "en");
    expect(input).toEqual(["ES", "AR"]);
  });
});
