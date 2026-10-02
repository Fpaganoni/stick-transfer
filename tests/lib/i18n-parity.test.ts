/**
 * What: Consistency checks across the en/es/fr message files.
 * Why: next-intl only logs a warning for a missing key, so a string added to
 *      one language silently renders as a raw key path in the others. These
 *      checks keep the three files in sync and make sure every backend enum
 *      value the umpire screens render has a label.
 */
import { describe, it, expect } from "vitest";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import fr from "@/messages/fr.json";
import { POSITION_TYPES } from "@/lib/job-position-type";
import {
  Role,
  UmpireLicenseLevel,
  TravelAvailability,
  UmpireModality,
  UmpireCategory,
} from "@/types/enums";

type Json = { [key: string]: Json | string };

function flatten(obj: Json, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out[path] = value;
    else Object.assign(out, flatten(value, path));
  }
  return out;
}

const locales = {
  en: flatten(en as unknown as Json),
  es: flatten(es as unknown as Json),
  fr: flatten(fr as unknown as Json),
};

/** ICU placeholders such as {count} or {name}, sorted. */
const placeholders = (text: string) =>
  [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("message files", () => {
  it.each(["es", "fr"] as const)("%s has every key that en has", (locale) => {
    const missing = Object.keys(locales.en).filter((key) => !(key in locales[locale]));
    expect(missing).toEqual([]);
  });

  it.each(["es", "fr"] as const)("%s has no key that en lacks", (locale) => {
    const extra = Object.keys(locales[locale]).filter((key) => !(key in locales.en));
    expect(extra).toEqual([]);
  });

  it.each(["en", "es", "fr"] as const)("%s has no empty strings", (locale) => {
    const empty = Object.entries(locales[locale])
      .filter(([, value]) => value.trim() === "")
      .map(([key]) => key);
    expect(empty).toEqual([]);
  });

  it.each(["es", "fr"] as const)(
    "%s keeps the same {placeholders} as en",
    (locale) => {
      const mismatched = Object.keys(locales.en)
        .filter((key) => key in locales[locale])
        .filter(
          (key) =>
            placeholders(locales.en[key]).join() !== placeholders(locales[locale][key]).join(),
        );
      expect(mismatched).toEqual([]);
    },
  );
});

describe("umpire labels", () => {
  const enumLabels: [string, string[]][] = [
    ["umpire.licenseLevels", Object.values(UmpireLicenseLevel)],
    ["umpire.travelAvailability", Object.values(TravelAvailability)],
    ["umpire.modalities", Object.values(UmpireModality)],
    ["umpire.categories", Object.values(UmpireCategory)],
    ["opportunities.positionTypes", [...POSITION_TYPES]],
  ];

  describe.each(["en", "es", "fr"] as const)("%s", (locale) => {
    it.each(enumLabels)("labels every value of %s", (namespace, values) => {
      const missing = values.filter((value) => !(`${namespace}.${value}` in locales[locale]));
      expect(missing).toEqual([]);
    });

    it("labels the umpire role in the register and explore role pickers", () => {
      expect(locales[locale]["register.roles.umpire"]).toBeTruthy();
      expect(locales[locale]["register.roleDescriptions.umpire"]).toBeTruthy();
      expect(locales[locale]["explore.roles.umpire"]).toBeTruthy();
    });
  });

  it("covers every Role the app can render with a register or explore label where applicable", () => {
    expect(Object.values(Role)).toContain("UMPIRE");
  });
});
