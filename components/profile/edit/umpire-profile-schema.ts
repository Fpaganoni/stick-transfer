import * as z from "zod";
import type { User, UpdateUserVariables } from "@/types/models/user";
import {
  UmpireLicenseLevel,
  TravelAvailability,
  UmpireModality,
  UmpireCategory,
} from "@/types/enums";

type Translate = (key: string) => string;

const CERTIFICATION_YEAR_MIN = 1950;
const CERTIFICATION_YEAR_MAX = 2100;

/** Empty string is allowed (field not filled); otherwise must be an integer within range. */
function intInRange(min: number, max: number, message: string) {
  return z
    .string()
    .optional()
    .refine((v) => {
      if (!v || v.trim() === "") return true;
      const n = Number(v);
      return Number.isInteger(n) && n >= min && n <= max;
    }, message);
}

export const createUmpireProfileSchema = (t: Translate) =>
  z.object({
    name: z.string().min(2, { message: t("editForm.validation.nameMin") }),
    username: z
      .string()
      .regex(/^[a-zA-Z0-9_]{3,20}$/, {
        message: t("editForm.validation.usernameMin"),
      }),
    avatar: z
      .string()
      .url({ message: t("editForm.validation.urlInvalid") })
      .optional()
      .or(z.literal("")),
    coverImage: z
      .string()
      .url({ message: t("editForm.validation.urlInvalid") })
      .optional()
      .or(z.literal("")),
    bio: z
      .string()
      .max(500, { message: t("editForm.validation.bioMax") })
      .optional(),
    country: z.string().optional(),
    city: z.string().optional(),

    // Numbers stay as strings in the form and are converted on submit, so an
    // empty input means "not provided" instead of 0.
    yearsOfExperience: intInRange(
      0,
      100,
      t("editForm.umpire.validation.nonNegative"),
    ),
    certificationYear: intInRange(
      CERTIFICATION_YEAR_MIN,
      CERTIFICATION_YEAR_MAX,
      t("editForm.umpire.validation.yearRange"),
    ),
    matchesOfficiated: intInRange(
      0,
      100000,
      t("editForm.umpire.validation.nonNegative"),
    ),

    licenseLevel: z.union([z.nativeEnum(UmpireLicenseLevel), z.literal("")]),
    certifyingBody: z.string().max(200).optional(),
    licenseNumber: z.string().max(100).optional(),
    travelAvailability: z.union([
      z.nativeEnum(TravelAvailability),
      z.literal(""),
    ]),
    languages: z.string().optional(),
    modalities: z.array(z.nativeEnum(UmpireModality)),
    umpireCategories: z.array(z.nativeEnum(UmpireCategory)),

    umpireCertifications: z.array(
      z.object({
        id: z.string().optional(),
        name: z
          .string()
          .min(1, { message: t("editForm.umpire.validation.certNameRequired") }),
        issuer: z
          .string()
          .min(1, { message: t("editForm.umpire.validation.issuerRequired") }),
        issuedAt: z.string().optional(),
        fileUrl: z
          .string()
          .url({ message: t("editForm.validation.urlInvalid") })
          .optional()
          .or(z.literal("")),
      }),
    ),

    trajectories: z
      .array(
        z.object({
          id: z.string().optional(),
          title: z
            .string()
            .min(1, { message: t("editForm.validation.titleRequired") }),
          organization: z.string().optional(),
          period: z
            .string()
            .min(1, { message: t("editForm.validation.periodRequired") }),
          description: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          isCurrent: z.boolean().optional(),
        }),
      )
      .optional(),
    multimedia: z
      .array(
        z.object({
          url: z.string().url({ message: t("editForm.validation.urlInvalid") }),
        }),
      )
      .optional(),
  });

export type UmpireProfileFormValues = z.infer<
  ReturnType<typeof createUmpireProfileSchema>
>;

type UmpireUser = Pick<
  User,
  "licenseLevel" | "certifyingBody" | "licenseNumber"
>;

/** "Español, English" -> ["Español", "English"] (trimmed, no blanks, no duplicates). */
export function parseLanguages(value?: string): string[] {
  const seen = new Set<string>();
  for (const part of (value ?? "").split(",")) {
    const lang = part.trim();
    if (lang) seen.add(lang);
  }
  return [...seen];
}

/**
 * Backend may serialize dates as ISO strings or ms timestamps; the form's
 * <input type="date"> needs YYYY-MM-DD.
 */
export function toDateInputValue(value?: string | null): string {
  if (!value) return "";
  const asNumber = Number(value);
  const date = Number.isNaN(asNumber) ? new Date(value) : new Date(asNumber);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

/**
 * Licence level, certifying body and licence number are the fields the backend
 * watches: editing them on a verified umpire resets `isVerified`.
 */
export function licenseFieldsChanged(
  values: Pick<
    UmpireProfileFormValues,
    "licenseLevel" | "certifyingBody" | "licenseNumber"
  >,
  user: UmpireUser,
): boolean {
  const levelChanged =
    values.licenseLevel !== "" && values.licenseLevel !== (user.licenseLevel ?? "");
  const bodyChanged =
    (values.certifyingBody ?? "").trim() !== (user.certifyingBody ?? "").trim();
  const numberChanged =
    (values.licenseNumber ?? "").trim() !== (user.licenseNumber ?? "").trim();
  return levelChanged || bodyChanged || numberChanged;
}

function optionalNumber(value?: string): number | undefined {
  if (!value || value.trim() === "") return undefined;
  return Number(value);
}

/**
 * Builds only the umpire-specific part of the updateUser variables.
 * Licence fields are sent only when they actually changed (the backend
 * un-verifies on any licence arg it receives, not on a diff); certifications,
 * languages, modalities and categories are always sent whole because the
 * backend replaces them wholesale.
 */
export function buildUmpireUpdateFields(
  values: UmpireProfileFormValues,
  user: UmpireUser,
): Partial<UpdateUserVariables> {
  const fields: Partial<UpdateUserVariables> = {
    languages: parseLanguages(values.languages),
    modalities: values.modalities,
    umpireCategories: values.umpireCategories,
    umpireCertifications: values.umpireCertifications.map((cert, index) => ({
      name: cert.name.trim(),
      issuer: cert.issuer.trim(),
      issuedAt: cert.issuedAt || undefined,
      fileUrl: cert.fileUrl || undefined,
      order: index,
    })),
  };

  const yearsOfExperience = optionalNumber(values.yearsOfExperience);
  if (yearsOfExperience !== undefined) fields.yearsOfExperience = yearsOfExperience;

  const certificationYear = optionalNumber(values.certificationYear);
  if (certificationYear !== undefined) fields.certificationYear = certificationYear;

  const matchesOfficiated = optionalNumber(values.matchesOfficiated);
  if (matchesOfficiated !== undefined) fields.matchesOfficiated = matchesOfficiated;

  if (values.travelAvailability !== "") {
    fields.travelAvailability = values.travelAvailability;
  }

  if (values.licenseLevel !== "" && values.licenseLevel !== (user.licenseLevel ?? "")) {
    fields.licenseLevel = values.licenseLevel;
  }
  if ((values.certifyingBody ?? "").trim() !== (user.certifyingBody ?? "").trim()) {
    fields.certifyingBody = (values.certifyingBody ?? "").trim();
  }
  if ((values.licenseNumber ?? "").trim() !== (user.licenseNumber ?? "").trim()) {
    fields.licenseNumber = (values.licenseNumber ?? "").trim();
  }

  return fields;
}
