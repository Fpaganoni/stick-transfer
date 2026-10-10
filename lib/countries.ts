/**
 * Countries are stored as uppercase ISO 3166-1 alpha-2 codes ("AR", "ES"),
 * plus the ISO 3166-2 codes of the UK home nations that field their own hockey
 * teams (GB-ENG, GB-SCT, GB-WLS). The API rejects anything else with
 * COUNTRY_INVALID.
 *
 * Keep in sync with the backend closed list:
 * stick-transfer-DB/src/common/geo/countries.ts
 */
// prettier-ignore
const ISO_3166_1_ALPHA_2 = [
  "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ",
  "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS",
  "BT", "BV", "BW", "BY", "BZ",
  "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO", "CR", "CU", "CV", "CW",
  "CX", "CY", "CZ",
  "DE", "DJ", "DK", "DM", "DO", "DZ",
  "EC", "EE", "EG", "EH", "ER", "ES", "ET",
  "FI", "FJ", "FK", "FM", "FO", "FR",
  "GA", "GB", "GD", "GE", "GF", "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT",
  "GU", "GW", "GY",
  "HK", "HM", "HN", "HR", "HT", "HU",
  "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT",
  "JE", "JM", "JO", "JP",
  "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ",
  "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY",
  "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS",
  "MT", "MU", "MV", "MW", "MX", "MY", "MZ",
  "NA", "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ",
  "OM",
  "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY",
  "QA",
  "RE", "RO", "RS", "RU", "RW",
  "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS",
  "ST", "SV", "SX", "SY", "SZ",
  "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ",
  "UA", "UG", "UM", "US", "UY", "UZ",
  "VA", "VC", "VE", "VG", "VI", "VN", "VU",
  "WF", "WS",
  "YE", "YT",
  "ZA", "ZM", "ZW",
] as const;

export const UK_HOME_NATIONS = ["GB-ENG", "GB-SCT", "GB-WLS"] as const;
export type UkHomeNation = (typeof UK_HOME_NATIONS)[number];

/** Translated names for the home nations (Intl.DisplayNames cannot name them). */
export type HomeNationNames = Partial<Record<UkHomeNation, string>>;

export const COUNTRY_CODES: readonly string[] = [...ISO_3166_1_ALPHA_2, ...UK_HOME_NATIONS];

const COUNTRY_CODE_SET: ReadonlySet<string> = new Set(COUNTRY_CODES);

/** Shown first in every country picker. */
// prettier-ignore
export const FEATURED_HOCKEY_COUNTRIES: readonly string[] = [
  "AR", "AU", "AT", "BE", "CA", "CL", "CN", "EG", "GB-ENG", "FR", "DE", "IN", "IE", "IT",
  "JP", "MY", "NL", "NZ", "PK", "PT", "GB-SCT", "ZA", "KR", "ES", "CH", "US", "UY", "GB-WLS",
];

const HOME_NATION_FALLBACK_NAMES: Record<UkHomeNation, string> = {
  "GB-ENG": "England",
  "GB-SCT": "Scotland",
  "GB-WLS": "Wales",
};

// Unicode subdivision flags: black flag + tag letters of "gbeng" + cancel tag
const BLACK_FLAG = 0x1f3f4;
const TAG_OFFSET = 0xe0000;
const CANCEL_TAG = 0xe007f;
const REGIONAL_INDICATOR_A = 0x1f1e6;

/** Uppercase code if `input` is a known code in any case (surrounding spaces ignored), else null. */
export function normalizeCountry(input?: string | null): string | null {
  const code = input?.trim().toUpperCase();
  return code && COUNTRY_CODE_SET.has(code) ? code : null;
}

export function isCountryCode(input?: string | null): boolean {
  return normalizeCountry(input) !== null;
}

function isHomeNation(code: string): code is UkHomeNation {
  return (UK_HOME_NATIONS as readonly string[]).includes(code);
}

const displayNamesByLocale = new Map<string, Intl.DisplayNames | null>();

function getRegionNames(locale: string): Intl.DisplayNames | null {
  if (!displayNamesByLocale.has(locale)) {
    let names: Intl.DisplayNames | null = null;
    try {
      names = new Intl.DisplayNames([locale], { type: "region" });
    } catch {
      // Runtime without Intl.DisplayNames or with an invalid locale: show codes
    }
    displayNamesByLocale.set(locale, names);
  }
  return displayNamesByLocale.get(locale) ?? null;
}

/**
 * Name of a country in `locale`. Home nations use `homeNationNames` (from the
 * message files) and fall back to English. A value that is not a known code
 * (legacy free text) is returned as it is, trimmed.
 */
export function getCountryName(
  value: string | null | undefined,
  locale: string,
  homeNationNames: HomeNationNames = {},
): string {
  const code = normalizeCountry(value);
  if (!code) return value?.trim() ?? "";
  if (isHomeNation(code)) return homeNationNames[code] ?? HOME_NATION_FALLBACK_NAMES[code];
  return getRegionNames(locale)?.of(code) ?? code;
}

/** Emoji flag of a known code ("AR" -> 🇦🇷, "GB-ENG" -> 🏴 England), else null. */
export function getCountryFlag(value?: string | null): string | null {
  const code = normalizeCountry(value);
  if (!code) return null;
  if (isHomeNation(code)) {
    const tags = code.replace("-", "").toLowerCase();
    return String.fromCodePoint(
      BLACK_FLAG,
      ...[...tags].map((c) => TAG_OFFSET + c.charCodeAt(0)),
      CANCEL_TAG,
    );
  }
  return String.fromCodePoint(
    ...[...code].map((c) => REGIONAL_INDICATOR_A + c.charCodeAt(0) - "A".charCodeAt(0)),
  );
}

/** New array of `codes` ordered by their translated name. */
export function sortCountriesByName(
  codes: readonly string[],
  locale: string,
  homeNationNames: HomeNationNames = {},
): string[] {
  const collator = new Intl.Collator(locale);
  return codes
    .map((code) => ({ code, name: getCountryName(code, locale, homeNationNames) }))
    .sort((a, b) => collator.compare(a.name, b.name))
    .map(({ code }) => code);
}
