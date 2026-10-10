/**
 * What: Unit tests for the umpire profile form helpers (schema, payload, licence diff).
 * Why: The backend un-verifies an umpire whenever a licence arg reaches updateUser,
 *      rejects out-of-range years, and replaces certification lists wholesale.
 *      These pure functions are what keep the form from silently unverifying
 *      users or sending values the API refuses.
 */
import { describe, it, expect } from "vitest";
import {
  createUmpireProfileSchema,
  buildUmpireUpdateFields,
  licenseFieldsChanged,
  parseLanguages,
  toDateInputValue,
  type UmpireProfileFormValues,
} from "@/components/profile/edit/umpire-profile-schema";
import {
  UmpireLicenseLevel,
  TravelAvailability,
  UmpireModality,
  UmpireCategory,
} from "@/types/enums";

const t = (key: string) => key;

const baseValues: UmpireProfileFormValues = {
  name: "Ana Ref",
  username: "ana_ref",
  avatar: "",
  coverImage: "",
  bio: "",
  country: "ES",
  city: "Madrid",
  yearsOfExperience: "",
  certificationYear: "",
  matchesOfficiated: "",
  licenseLevel: "",
  certifyingBody: "",
  licenseNumber: "",
  travelAvailability: "",
  languages: "",
  modalities: [],
  umpireCategories: [],
  umpireCertifications: [],
  trajectories: [],
};

const noLicense = { licenseLevel: null, certifyingBody: null, licenseNumber: null };

describe("createUmpireProfileSchema", () => {
  const schema = createUmpireProfileSchema(t);

  it("accepts a profile with all optional numbers left empty", () => {
    expect(schema.safeParse(baseValues).success).toBe(true);
  });

  it.each(["ES", "gb-eng", ""])("accepts country %j", (country) => {
    expect(schema.safeParse({ ...baseValues, country }).success).toBe(true);
  });

  it("rejects a country that is not an ISO code", () => {
    const result = schema.safeParse({ ...baseValues, country: "Spain" });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({
      path: ["country"],
      message: "editForm.validation.countryInvalid",
    });
  });

  it("has no multimedia field and strips one if present", () => {
    const parsed = schema.parse({ ...baseValues, multimedia: [{ url: "not-a-url" }] });

    expect(parsed).not.toHaveProperty("multimedia");
  });

  it.each(["1949", "2101", "abc", "2000.5"])(
    "rejects certificationYear %s",
    (certificationYear) => {
      const result = schema.safeParse({ ...baseValues, certificationYear });
      expect(result.success).toBe(false);
      expect(JSON.stringify(result)).toContain("editForm.umpire.validation.yearRange");
    },
  );

  it.each(["1950", "2018", "2100"])("accepts certificationYear %s", (certificationYear) => {
    expect(schema.safeParse({ ...baseValues, certificationYear }).success).toBe(true);
  });

  it.each(["yearsOfExperience", "matchesOfficiated"] as const)(
    "rejects a negative %s",
    (field) => {
      const result = schema.safeParse({ ...baseValues, [field]: "-1" });
      expect(result.success).toBe(false);
      expect(JSON.stringify(result)).toContain("editForm.umpire.validation.nonNegative");
    },
  );

  it("rejects licence levels the backend does not know", () => {
    expect(schema.safeParse({ ...baseValues, licenseLevel: "NATIONAL" }).success).toBe(false);
  });

  it("requires name and issuer on every certification", () => {
    const result = schema.safeParse({
      ...baseValues,
      umpireCertifications: [{ name: "", issuer: "", issuedAt: "", fileUrl: "" }],
    });
    expect(result.success).toBe(false);
    const text = JSON.stringify(result);
    expect(text).toContain("certNameRequired");
    expect(text).toContain("issuerRequired");
  });

  it("rejects a certification document that is not a URL", () => {
    const result = schema.safeParse({
      ...baseValues,
      umpireCertifications: [{ name: "A", issuer: "B", fileUrl: "not-a-url" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("parseLanguages", () => {
  it("trims, drops blanks and removes duplicates", () => {
    expect(parseLanguages(" Español,English , ,English,Français ")).toEqual([
      "Español",
      "English",
      "Français",
    ]);
  });

  it("returns [] for empty or missing input", () => {
    expect(parseLanguages("")).toEqual([]);
    expect(parseLanguages(undefined)).toEqual([]);
  });
});

describe("toDateInputValue", () => {
  it("converts ISO strings to YYYY-MM-DD", () => {
    expect(toDateInputValue("2018-06-01T00:00:00.000Z")).toBe("2018-06-01");
  });

  it("converts ms timestamps (the backend may serialize either way)", () => {
    expect(toDateInputValue(String(Date.UTC(2018, 5, 1)))).toBe("2018-06-01");
  });

  it("returns empty string for missing or invalid values", () => {
    expect(toDateInputValue(null)).toBe("");
    expect(toDateInputValue(undefined)).toBe("");
    expect(toDateInputValue("garbage")).toBe("");
  });
});

describe("licenseFieldsChanged", () => {
  const user = {
    licenseLevel: UmpireLicenseLevel.NACIONAL,
    certifyingBody: "CAH",
    licenseNumber: "CAH-1",
  };

  it("is false when nothing about the licence changed", () => {
    expect(
      licenseFieldsChanged(
        { licenseLevel: UmpireLicenseLevel.NACIONAL, certifyingBody: "CAH", licenseNumber: "CAH-1" },
        user,
      ),
    ).toBe(false);
  });

  it("ignores surrounding whitespace", () => {
    expect(
      licenseFieldsChanged(
        { licenseLevel: UmpireLicenseLevel.NACIONAL, certifyingBody: " CAH ", licenseNumber: "CAH-1 " },
        user,
      ),
    ).toBe(false);
  });

  it.each([
    ["level", { licenseLevel: UmpireLicenseLevel.INTERNACIONAL, certifyingBody: "CAH", licenseNumber: "CAH-1" }],
    ["body", { licenseLevel: UmpireLicenseLevel.NACIONAL, certifyingBody: "FIH", licenseNumber: "CAH-1" }],
    ["number", { licenseLevel: UmpireLicenseLevel.NACIONAL, certifyingBody: "CAH", licenseNumber: "X" }],
  ] as const)("is true when the %s changed", (_name, values) => {
    expect(licenseFieldsChanged(values, user)).toBe(true);
  });

  it("treats an empty level as 'not touched' (cannot be cleared)", () => {
    expect(
      licenseFieldsChanged(
        { licenseLevel: "", certifyingBody: "CAH", licenseNumber: "CAH-1" },
        user,
      ),
    ).toBe(false);
  });

  it("treats null stored values like empty strings", () => {
    expect(
      licenseFieldsChanged(
        { licenseLevel: "", certifyingBody: "", licenseNumber: "" },
        noLicense,
      ),
    ).toBe(false);
  });
});

describe("buildUmpireUpdateFields", () => {
  it("omits untouched licence fields so the backend does not un-verify", () => {
    const user = {
      licenseLevel: UmpireLicenseLevel.NACIONAL,
      certifyingBody: "CAH",
      licenseNumber: "CAH-1",
    };
    const fields = buildUmpireUpdateFields(
      {
        ...baseValues,
        licenseLevel: UmpireLicenseLevel.NACIONAL,
        certifyingBody: "CAH",
        licenseNumber: "CAH-1",
        matchesOfficiated: "130",
      },
      user,
    );

    expect(fields).not.toHaveProperty("licenseLevel");
    expect(fields).not.toHaveProperty("certifyingBody");
    expect(fields).not.toHaveProperty("licenseNumber");
    expect(fields.matchesOfficiated).toBe(130);
  });

  it("sends licence fields that changed, trimmed", () => {
    const fields = buildUmpireUpdateFields(
      {
        ...baseValues,
        licenseLevel: UmpireLicenseLevel.INTERNACIONAL,
        certifyingBody: " FIH ",
        licenseNumber: "FIH-9",
      },
      { licenseLevel: UmpireLicenseLevel.NACIONAL, certifyingBody: "CAH", licenseNumber: "CAH-1" },
    );

    expect(fields).toMatchObject({
      licenseLevel: UmpireLicenseLevel.INTERNACIONAL,
      certifyingBody: "FIH",
      licenseNumber: "FIH-9",
    });
  });

  it("converts numeric strings and leaves empty ones out", () => {
    const fields = buildUmpireUpdateFields(
      { ...baseValues, yearsOfExperience: "14", certificationYear: "2012", matchesOfficiated: "" },
      noLicense,
    );

    expect(fields.yearsOfExperience).toBe(14);
    expect(fields.certificationYear).toBe(2012);
    expect(fields).not.toHaveProperty("matchesOfficiated");
  });

  it("keeps 0 as a real value for numeric fields", () => {
    const fields = buildUmpireUpdateFields(
      { ...baseValues, matchesOfficiated: "0", yearsOfExperience: "0" },
      noLicense,
    );

    expect(fields.matchesOfficiated).toBe(0);
    expect(fields.yearsOfExperience).toBe(0);
  });

  it("always sends the replace-whole lists, even when empty", () => {
    const fields = buildUmpireUpdateFields(baseValues, noLicense);

    expect(fields.languages).toEqual([]);
    expect(fields.modalities).toEqual([]);
    expect(fields.umpireCategories).toEqual([]);
    expect(fields.umpireCertifications).toEqual([]);
  });

  it("maps arrays, availability and ordered certifications", () => {
    const fields = buildUmpireUpdateFields(
      {
        ...baseValues,
        languages: "Español, English",
        modalities: [UmpireModality.OUTDOOR, UmpireModality.INDOOR],
        umpireCategories: [UmpireCategory.MAYORES, UmpireCategory.FEMENINO],
        travelAvailability: TravelAvailability.REGIONAL,
        umpireCertifications: [
          { id: "c1", name: " Licencia ", issuer: "CAH", issuedAt: "2018-06-01", fileUrl: "" },
          { name: "Curso", issuer: "FIH", issuedAt: "", fileUrl: "https://x.test/a.pdf" },
        ],
      },
      noLicense,
    );

    expect(fields.languages).toEqual(["Español", "English"]);
    expect(fields.modalities).toEqual(["OUTDOOR", "INDOOR"]);
    expect(fields.umpireCategories).toEqual(["MAYORES", "FEMENINO"]);
    expect(fields.travelAvailability).toBe("REGIONAL");
    expect(fields.umpireCertifications).toEqual([
      { name: "Licencia", issuer: "CAH", issuedAt: "2018-06-01", fileUrl: undefined, order: 0 },
      { name: "Curso", issuer: "FIH", issuedAt: undefined, fileUrl: "https://x.test/a.pdf", order: 1 },
    ]);
  });

  it("does not send an empty travelAvailability", () => {
    expect(buildUmpireUpdateFields(baseValues, noLicense)).not.toHaveProperty("travelAvailability");
  });
});
