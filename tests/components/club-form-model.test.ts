/**
 * What: Tests for the club edit form model (benefits, variables sent, server errors).
 * Why: updateClub is the only write of the club form. It must never carry a field
 *      of a person (the backend rejects them for a CLUB), clearing a field must
 *      send an explicit empty value, and every backend refusal must land on the
 *      field that caused it instead of a generic toast.
 */
import { describe, it, expect } from "vitest";
import {
  formatBenefits,
  getClubFormValues,
  mapClubSaveError,
  parseBenefits,
  toUpdateClubVariables,
  type ClubFormValues,
} from "@/components/profile/edit/club-form-model";
import type { Club } from "@/types/models/club";

const baseValues: ClubFormValues = {
  name: "  HC Barcelona  ",
  username: "hcbarcelona",
  bio: "Since 1950",
  logo: "https://res.cloudinary.com/demo/crest.png",
  coverImage: "https://res.cloudinary.com/demo/cover.jpg",
  country: "ES",
  city: " Barcelona ",
  description: "A great club",
  league: "Primera",
  foundedYear: "1950",
  benefits: "Housing, Meals",
  managedByFirstName: " Ana ",
  managedByLastName: "Garcia",
  website: "hcbarcelona.es",
  email: "info@hcbarcelona.es",
  phone: "+34 600 123 456",
  instagram: "@hcbarcelona",
  twitter: "",
  facebook: "",
  tiktok: "",
};

function backendError(extensions: Record<string, unknown>) {
  return { response: { errors: [{ message: "x", extensions }] } };
}

describe("benefits", () => {
  it("splits on commas and new lines and trims", () => {
    expect(parseBenefits(" Housing ,Meals\nCar ,, ")).toEqual(["Housing", "Meals", "Car"]);
  });

  it("drops duplicates ignoring case", () => {
    expect(parseBenefits("Meals, meals, MEALS, Car")).toEqual(["Meals", "Car"]);
  });

  it("gives an empty list for blank text", () => {
    expect(parseBenefits("  ,  ")).toEqual([]);
  });

  it("round trips through formatBenefits", () => {
    expect(formatBenefits(["Housing", "Meals"])).toBe("Housing, Meals");
    expect(formatBenefits(undefined)).toBe("");
  });
});

describe("getClubFormValues", () => {
  it("starts from the club, which carries the account identity", () => {
    const club: Club = {
      id: "club-1",
      name: "HC Barcelona",
      logo: "https://img/crest.png",
      coverImage: "https://img/cover.jpg",
      bio: "Since 1950",
      description: "A great club",
      city: "Barcelona",
      country: "ES",
      league: "Primera",
      foundedYear: 1950,
      benefits: ["Housing", "Meals"],
      managedBy: { firstName: "Ana", lastName: "Garcia" },
      user: { id: "club-1", username: "hcbarcelona" },
    };

    expect(getClubFormValues(club)).toMatchObject({
      name: "HC Barcelona",
      username: "hcbarcelona",
      logo: "https://img/crest.png",
      coverImage: "https://img/cover.jpg",
      bio: "Since 1950",
      country: "ES",
      city: "Barcelona",
      description: "A great club",
      league: "Primera",
      foundedYear: "1950",
      benefits: "Housing, Meals",
      managedByFirstName: "Ana",
      managedByLastName: "Garcia",
    });
  });

  it("is empty, not undefined, before the club loads", () => {
    const values = getClubFormValues(undefined);

    expect(values.name).toBe("");
    expect(values.managedByFirstName).toBe("");
    expect(values.benefits).toBe("");
  });

  it("copes with a private managedBy that came back null", () => {
    expect(getClubFormValues({ id: "c", name: "C", managedBy: null }).managedByFirstName).toBe("");
  });
});

describe("toUpdateClubVariables", () => {
  it("builds one updateClub payload with trimmed, normalized values", () => {
    expect(toUpdateClubVariables("club-1", baseValues)).toEqual({
      id: "club-1",
      name: "HC Barcelona",
      username: "hcbarcelona",
      bio: "Since 1950",
      logo: "https://res.cloudinary.com/demo/crest.png",
      coverImage: "https://res.cloudinary.com/demo/cover.jpg",
      country: "ES",
      city: "Barcelona",
      description: "A great club",
      league: "Primera",
      foundedYear: 1950,
      benefits: ["Housing", "Meals"],
      managedByFirstName: "Ana",
      managedByLastName: "Garcia",
      website: "https://hcbarcelona.es",
      email: "info@hcbarcelona.es",
      phone: "+34 600 123 456",
      instagram: "hcbarcelona",
      twitter: "",
      facebook: "",
      tiktok: "",
    });
  });

  it("never carries a field of a person", () => {
    const keys = Object.keys(toUpdateClubVariables("club-1", baseValues));

    for (const forbidden of [
      "avatar",
      "dateOfBirth",
      "cvUrl",
      "position",
      "yearsOfExperience",
      "level",
      "trajectories",
      "multimedia",
      "licenseLevel",
      "languages",
    ]) {
      expect(keys).not.toContain(forbidden);
    }
  });

  it("sends empty values to clear the crest, the cover and the benefits", () => {
    const variables = toUpdateClubVariables("club-1", {
      ...baseValues,
      logo: "",
      coverImage: "",
      benefits: "",
    });

    expect(variables.logo).toBe("");
    expect(variables.coverImage).toBe("");
    expect(variables.benefits).toEqual([]);
  });

  it("sends null to clear the founded year when it is blank, instead of keeping the old one", () => {
    const variables = toUpdateClubVariables("club-1", { ...baseValues, foundedYear: " " });

    expect(variables.foundedYear).toBeNull();
  });
});

describe("mapClubSaveError", () => {
  it("points CLUB_NAME_TAKEN at the club name", () => {
    expect(
      mapClubSaveError(backendError({ code: "CLUB_NAME_TAKEN", field: "name" })),
    ).toEqual({ fields: [{ name: "name", messageKey: "clubNameTaken" }], showToast: false });
  });

  it("points USERNAME_TAKEN at the username", () => {
    expect(
      mapClubSaveError(backendError({ code: "USERNAME_TAKEN", field: "username" })),
    ).toEqual({ fields: [{ name: "username", messageKey: "usernameTaken" }], showToast: false });
  });

  it("places every VALIDATION_ERROR field on its input", () => {
    const result = mapClubSaveError(
      backendError({
        code: "VALIDATION_ERROR",
        fields: [
          { field: "logo", code: "IMAGE_URL_INVALID" },
          { field: "coverImage", code: "IMAGE_URL_INVALID" },
          { field: "country", code: "COUNTRY_INVALID" },
          { field: "city", code: "FIELD_REQUIRED" },
          { field: "managedByFirstName", code: "NAME_INVALID" },
          { field: "name", code: "NAME_TOO_LONG" },
        ],
      }),
    );

    expect(result.showToast).toBe(false);
    expect(result.fields).toEqual([
      { name: "logo", messageKey: "imageInvalid" },
      { name: "coverImage", messageKey: "imageInvalid" },
      { name: "country", messageKey: "countryInvalid" },
      { name: "city", messageKey: "fieldRequired" },
      { name: "managedByFirstName", messageKey: "nameInvalid" },
      { name: "name", messageKey: "nameTooLong" },
    ]);
  });

  it("places the contact field errors the backend validates on their inputs", () => {
    const result = mapClubSaveError(
      backendError({
        code: "VALIDATION_ERROR",
        fields: [
          { field: "website", code: "URL_INVALID" },
          { field: "email", code: "EMAIL_INVALID" },
          { field: "phone", code: "PHONE_INVALID" },
        ],
      }),
    );

    expect(result.showToast).toBe(false);
    expect(result.fields).toEqual([
      { name: "website", messageKey: "urlInvalid" },
      { name: "email", messageKey: "emailInvalid" },
      { name: "phone", messageKey: "phoneInvalid" },
    ]);
  });

  it("falls back to a toast for a field or code it cannot place", () => {
    const result = mapClubSaveError(
      backendError({
        code: "VALIDATION_ERROR",
        fields: [
          { field: "name", code: "NAME_INVALID" },
          { field: "dateOfBirth", code: "FIELD_NOT_ALLOWED" },
        ],
      }),
    );

    expect(result.fields).toEqual([{ name: "name", messageKey: "nameInvalid" }]);
    expect(result.showToast).toBe(true);
  });

  it.each([
    ["a network failure", new Error("offline")],
    ["an unknown code", backendError({ code: "SOMETHING_NEW" })],
  ])("only shows a toast for %s", (_label, error) => {
    expect(mapClubSaveError(error)).toEqual({ fields: [], showToast: true });
  });
});
