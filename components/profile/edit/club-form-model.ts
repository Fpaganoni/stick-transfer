import * as z from "zod";
import { isCountryCode } from "@/lib/countries";
import { parseApiError } from "@/lib/auth-errors";
import type { Club, UpdateClubVariables } from "@/types/models/club";
import {
  createClubContactShape,
  getClubContactValues,
  toClubContactVariables,
} from "./club-contact-fields";

/**
 * The model of the club edit form. A CLUB account IS the club, so identity
 * (name, username, bio, crest, cover, place) and club data live in one form and
 * are saved with a single updateClub call. Nothing here belongs to a person.
 */

const MAX_BENEFITS = 20;
const MAX_BENEFIT_LENGTH = 60;
const MIN_FOUNDED_YEAR = 1800;

/** "Housing, Meals" -> ["Housing", "Meals"]: split on commas and new lines, no empties or repeats. */
export function parseBenefits(text: string): string[] {
  const seen = new Set<string>();
  const benefits: string[] = [];
  for (const part of text.split(/[,\n]/)) {
    const benefit = part.trim();
    const key = benefit.toLowerCase();
    if (!benefit || seen.has(key)) continue;
    seen.add(key);
    benefits.push(benefit);
  }
  return benefits;
}

export function formatBenefits(benefits: readonly string[] | undefined): string {
  return (benefits ?? []).join(", ");
}

function isValidFoundedYear(value: string): boolean {
  if (!/^\d{4}$/.test(value)) return false;
  const year = Number(value);
  return year >= MIN_FOUNDED_YEAR && year <= new Date().getFullYear();
}

function areBenefitsValid(text: string): boolean {
  const benefits = parseBenefits(text);
  return (
    benefits.length <= MAX_BENEFITS && benefits.every((benefit) => benefit.length <= MAX_BENEFIT_LENGTH)
  );
}

const urlOrEmpty = (message: string) =>
  z.string().url({ message }).or(z.literal(""));

export const createClubFormSchema = (t: (key: string) => string) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(2, { message: t("editForm.club.validation.nameMin") })
      .max(100, { message: t("editForm.club.validation.nameMax") }),
    username: z.string().trim().regex(/^[a-zA-Z0-9_]{3,20}$/, {
      message: t("editForm.validation.usernameMin"),
    }),
    bio: z.string().max(500, { message: t("editForm.validation.bioMax") }),
    logo: urlOrEmpty(t("editForm.validation.urlInvalid")),
    coverImage: urlOrEmpty(t("editForm.validation.urlInvalid")),
    country: z
      .string()
      .min(1, { message: t("editForm.validation.countryInvalid") })
      .refine(isCountryCode, { message: t("editForm.validation.countryInvalid") }),
    city: z.string().trim().min(1, { message: t("editForm.club.validation.cityRequired") }),
    description: z.string().max(2000, { message: t("editForm.club.validation.descriptionMax") }),
    league: z.string().max(100, { message: t("editForm.club.validation.leagueMax") }),
    foundedYear: z
      .string()
      .trim()
      .refine((value) => value === "" || isValidFoundedYear(value), {
        message: t("editForm.club.validation.foundedYearInvalid"),
      }),
    benefits: z.string().refine(areBenefitsValid, {
      message: t("editForm.club.validation.benefitsInvalid"),
    }),
    managedByFirstName: z
      .string()
      .trim()
      .min(1, { message: t("editForm.club.validation.managedByFirstNameRequired") })
      .max(100, { message: t("editForm.club.validation.nameMax") }),
    managedByLastName: z
      .string()
      .trim()
      .min(1, { message: t("editForm.club.validation.managedByLastNameRequired") })
      .max(100, { message: t("editForm.club.validation.nameMax") }),
    ...createClubContactShape(t),
  });

export type ClubFormValues = z.infer<ReturnType<typeof createClubFormSchema>>;

/** The club carries the identity of the account (name, crest, cover, place, bio, username). */
export function getClubFormValues(club: Club | undefined): ClubFormValues {
  return {
    name: club?.name ?? "",
    username: club?.user?.username ?? "",
    bio: club?.bio ?? "",
    logo: club?.logo ?? "",
    coverImage: club?.coverImage ?? "",
    country: club?.country ?? "",
    city: club?.city ?? "",
    description: club?.description ?? "",
    league: club?.league ?? "",
    foundedYear: club?.foundedYear ? String(club.foundedYear) : "",
    benefits: formatBenefits(club?.benefits),
    managedByFirstName: club?.managedBy?.firstName ?? "",
    managedByLastName: club?.managedBy?.lastName ?? "",
    ...getClubContactValues(club),
  };
}

/**
 * The only write of the form. Only identity and club fields: the backend still
 * accepts (and stores) a person's fields for a CLUB, so none is ever sent. An
 * empty crest, cover or benefits list is sent as such to clear it.
 */
export function toUpdateClubVariables(
  clubId: string,
  values: ClubFormValues,
): UpdateClubVariables {
  const foundedYear = Number.parseInt(values.foundedYear.trim(), 10);

  return {
    id: clubId,
    name: values.name.trim(),
    username: values.username.trim(),
    bio: values.bio.trim(),
    logo: values.logo,
    coverImage: values.coverImage,
    country: values.country,
    city: values.city.trim(),
    description: values.description.trim(),
    league: values.league.trim(),
    // null clears the year; leaving it out would keep the old one
    foundedYear: Number.isFinite(foundedYear) ? foundedYear : null,
    benefits: parseBenefits(values.benefits),
    managedByFirstName: values.managedByFirstName.trim(),
    managedByLastName: values.managedByLastName.trim(),
    ...toClubContactVariables(values),
  };
}

// --- Backend refusals -> the field that caused them -------------------------

export type ClubErrorField = keyof ClubFormValues;

export interface ClubSaveErrors {
  /** Errors to show under their input; messageKey is under profile.editForm.club.serverErrors. */
  fields: Array<{ name: ClubErrorField; messageKey: string }>;
  /** True when something could not be placed on a field (or is not a field error). */
  showToast: boolean;
}

const SERVER_FIELD: Record<string, ClubErrorField> = {
  name: "name",
  clubName: "name",
  username: "username",
  logo: "logo",
  coverImage: "coverImage",
  city: "city",
  country: "country",
  managedByFirstName: "managedByFirstName",
  managedByLastName: "managedByLastName",
  website: "website",
  email: "email",
  phone: "phone",
};

const SERVER_MESSAGE: Record<string, string> = {
  NAME_REQUIRED: "nameRequired",
  NAME_TOO_LONG: "nameTooLong",
  NAME_INVALID: "nameInvalid",
  USERNAME_INVALID: "usernameInvalid",
  USERNAME_RESERVED: "usernameReserved",
  IMAGE_URL_INVALID: "imageInvalid",
  COUNTRY_INVALID: "countryInvalid",
  FIELD_REQUIRED: "fieldRequired",
  URL_INVALID: "urlInvalid",
  EMAIL_INVALID: "emailInvalid",
  PHONE_INVALID: "phoneInvalid",
};

export function mapClubSaveError(error: unknown): ClubSaveErrors {
  const parsed = parseApiError(error);

  switch (parsed.code) {
    case "CLUB_NAME_TAKEN":
      return { fields: [{ name: "name", messageKey: "clubNameTaken" }], showToast: false };
    case "USERNAME_TAKEN":
      return { fields: [{ name: "username", messageKey: "usernameTaken" }], showToast: false };
    case "VALIDATION_ERROR": {
      const fields: ClubSaveErrors["fields"] = [];
      let unplaced = parsed.fields.length === 0;
      for (const { field, code } of parsed.fields) {
        const name = SERVER_FIELD[field];
        const messageKey = SERVER_MESSAGE[code];
        if (name && messageKey) fields.push({ name, messageKey });
        else unplaced = true;
      }
      return { fields, showToast: unplaced };
    }
    default:
      return { fields: [], showToast: true };
  }
}
