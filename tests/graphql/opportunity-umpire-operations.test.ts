/**
 * What: Static checks on the job opportunity GraphQL documents.
 * Why: The backend validates enum-typed variables at the GraphQL layer, so a
 *      wrong variable type or a missing argument forwarding would make every
 *      umpire opportunity fail to publish or to show its requirements.
 */
import { describe, it, expect } from "vitest";
import { parse, print } from "graphql";
import type { FieldNode, OperationDefinitionNode } from "graphql";
import { GET_JOB_OPPORTUNITIES } from "@/graphql/opportunity/queries";
import { CREATE_JOB_OPPORTUNITY } from "@/graphql/opportunity/mutations";

function operation(doc: string): OperationDefinitionNode {
  const def = parse(doc).definitions[0];
  if (def.kind !== "OperationDefinition") throw new Error("not an operation");
  return def;
}

const rootField = (doc: string) =>
  operation(doc).selectionSet.selections[0] as FieldNode;

const selected = (doc: string) =>
  rootField(doc).selectionSet!.selections.map((s) => (s as FieldNode).name.value);

const UMPIRE_FIELDS = ["licenseLevelRequired", "modality", "umpireCategory", "matchDate"];

describe("GET_JOB_OPPORTUNITIES", () => {
  it("parses as valid GraphQL", () => {
    expect(() => print(parse(GET_JOB_OPPORTUNITIES))).not.toThrow();
  });

  it("selects the umpire requirements", () => {
    expect(selected(GET_JOB_OPPORTUNITIES)).toEqual(expect.arrayContaining(UMPIRE_FIELDS));
  });

  it("still selects the fields the list already relied on", () => {
    expect(selected(GET_JOB_OPPORTUNITIES)).toEqual(
      expect.arrayContaining(["id", "title", "positionType", "club", "level", "status", "createdAt"]),
    );
  });
});

describe("CREATE_JOB_OPPORTUNITY", () => {
  const variables = () =>
    Object.fromEntries(
      operation(CREATE_JOB_OPPORTUNITY).variableDefinitions!.map((v) => [
        v.variable.name.value,
        print(v.type),
      ]),
    );

  it("declares the umpire variables with the backend types", () => {
    expect(variables()).toMatchObject({
      licenseLevelRequired: "UmpireLicenseLevel",
      modality: "UmpireModality",
      umpireCategory: "UmpireCategory",
      matchDate: "String",
    });
  });

  it("keeps the umpire variables optional (they only apply to UMPIRE jobs)", () => {
    const v = variables();
    for (const field of UMPIRE_FIELDS) expect(v[field]).not.toMatch(/!$/);
  });

  it("forwards the umpire variables to createJobOpportunity", () => {
    const args = (rootField(CREATE_JOB_OPPORTUNITY).arguments ?? []).map((a) => a.name.value);
    expect(args).toEqual(expect.arrayContaining(UMPIRE_FIELDS));
  });

  it("returns the umpire fields", () => {
    expect(selected(CREATE_JOB_OPPORTUNITY)).toEqual(expect.arrayContaining(UMPIRE_FIELDS));
  });
});
