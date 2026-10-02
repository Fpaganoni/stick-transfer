/**
 * What: Static checks on the user GraphQL documents that carry umpire data.
 * Why: The backend rejects unknown fields/args at validation time, and a typo in
 *      an umpire field would break `me` (and therefore every logged-in page).
 *      Parsing the documents catches syntax errors and missing selections
 *      without needing a live server.
 */
import { describe, it, expect } from "vitest";
import { parse, print } from "graphql";
import type { FieldNode, OperationDefinitionNode, SelectionNode } from "graphql";
import { ME, GET_USER, GET_USER_BY_USERNAME, EXPLORE_USERS_QUERY } from "@/graphql/user/queries";
import { UPDATE_USER } from "@/graphql/user/mutations";

const UMPIRE_SCALARS = [
  "licenseLevel",
  "certifyingBody",
  "certificationYear",
  "matchesOfficiated",
  "travelAvailability",
  "languages",
  "modalities",
  "umpireCategories",
];

const CERT_FIELDS = ["id", "name", "issuer", "issuedAt", "fileUrl", "order"];

function operation(doc: string): OperationDefinitionNode {
  const def = parse(doc).definitions[0];
  if (def.kind !== "OperationDefinition") throw new Error("not an operation");
  return def;
}

function rootField(doc: string): FieldNode {
  return operation(doc).selectionSet.selections[0] as FieldNode;
}

function names(selections: readonly SelectionNode[]): string[] {
  return selections.map((s) => (s as FieldNode).name.value);
}

function children(field: FieldNode, name: string): string[] {
  const child = field.selectionSet!.selections.find(
    (s) => (s as FieldNode).name.value === name,
  ) as FieldNode;
  return names(child.selectionSet!.selections);
}

describe.each([
  ["ME", ME],
  ["GET_USER", GET_USER],
  ["GET_USER_BY_USERNAME", GET_USER_BY_USERNAME],
])("%s", (_label, doc) => {
  it("parses as valid GraphQL", () => {
    expect(() => print(parse(doc))).not.toThrow();
  });

  it("selects every umpire profile field", () => {
    const selected = names(rootField(doc).selectionSet!.selections);
    for (const field of [...UMPIRE_SCALARS, "umpireCertifications", "isVerified", "yearsOfExperience"]) {
      expect(selected).toContain(field);
    }
  });

  it("selects the full certification shape", () => {
    expect(children(rootField(doc), "umpireCertifications")).toEqual(CERT_FIELDS);
  });
});

describe("ME", () => {
  it("also selects the private licenseNumber for the owner", () => {
    expect(names(rootField(ME).selectionSet!.selections)).toContain("licenseNumber");
  });
});

describe("EXPLORE_USERS_QUERY", () => {
  it("declares the umpire filter variables with the backend enum types", () => {
    const vars = Object.fromEntries(
      operation(EXPLORE_USERS_QUERY).variableDefinitions!.map((v) => [
        v.variable.name.value,
        print(v.type),
      ]),
    );
    expect(vars.licenseLevel).toBe("UmpireLicenseLevel");
    expect(vars.modality).toBe("UmpireModality");
    expect(vars.umpireCategory).toBe("UmpireCategory");
  });

  it("forwards the umpire filters as exploreUsers arguments", () => {
    const args = names(rootField(EXPLORE_USERS_QUERY).arguments as unknown as SelectionNode[]);
    expect(args).toEqual(expect.arrayContaining(["licenseLevel", "modality", "umpireCategory"]));
  });

  it("selects the fields needed to render an umpire card", () => {
    const selected = names(rootField(EXPLORE_USERS_QUERY).selectionSet!.selections);
    for (const field of [
      "licenseLevel",
      "travelAvailability",
      "modalities",
      "umpireCategories",
      "matchesOfficiated",
      "isVerified",
    ]) {
      expect(selected).toContain(field);
    }
  });
});

describe("UPDATE_USER", () => {
  const vars = () =>
    Object.fromEntries(
      operation(UPDATE_USER).variableDefinitions!.map((v) => [
        v.variable.name.value,
        print(v.type),
      ]),
    );

  it("accepts every umpire variable with the backend types", () => {
    expect(vars()).toMatchObject({
      licenseLevel: "UmpireLicenseLevel",
      certifyingBody: "String",
      licenseNumber: "String",
      certificationYear: "Int",
      matchesOfficiated: "Int",
      travelAvailability: "TravelAvailability",
      languages: "[String!]",
      modalities: "[UmpireModality!]",
      umpireCategories: "[UmpireCategory!]",
      umpireCertifications: "[UmpireCertificationInput!]",
    });
  });

  it("passes the umpire variables through to updateUser", () => {
    const args = (rootField(UPDATE_USER).arguments ?? []).map((a) => a.name.value);
    expect(args).toEqual(
      expect.arrayContaining([
        "licenseLevel",
        "certifyingBody",
        "licenseNumber",
        "certificationYear",
        "matchesOfficiated",
        "travelAvailability",
        "languages",
        "modalities",
        "umpireCategories",
        "umpireCertifications",
      ]),
    );
  });

  it("returns the umpire fields so the cache can refresh from the response", () => {
    const selected = names(rootField(UPDATE_USER).selectionSet!.selections);
    expect(selected).toEqual(
      expect.arrayContaining([...UMPIRE_SCALARS, "umpireCertifications", "isVerified"]),
    );
  });
});
