/**
 * What: Static checks on the admin GraphQL documents that carry umpire data.
 * Why: The admin dashboard and user table depend on fields the backend added
 *      for umpires (counts, licence data). A typo would fail validation and
 *      blank the whole admin overview.
 */
import { describe, it, expect } from "vitest";
import { parse, print } from "graphql";
import type { FieldNode, OperationDefinitionNode } from "graphql";
import { ADMIN_DASHBOARD_STATS, ADMIN_USERS } from "@/graphql/admin/queries";
import { ADMIN_CHANGE_USER_ROLE } from "@/graphql/admin/mutations";

function operation(doc: string): OperationDefinitionNode {
  const def = parse(doc).definitions[0];
  if (def.kind !== "OperationDefinition") throw new Error("not an operation");
  return def;
}

const selected = (doc: string) =>
  (operation(doc).selectionSet.selections[0] as FieldNode).selectionSet!.selections.map(
    (s) => (s as FieldNode).name.value,
  );

describe("ADMIN_DASHBOARD_STATS", () => {
  it("parses as valid GraphQL", () => {
    expect(() => print(parse(ADMIN_DASHBOARD_STATS))).not.toThrow();
  });

  it("selects the umpire counts", () => {
    expect(selected(ADMIN_DASHBOARD_STATS)).toEqual(
      expect.arrayContaining(["umpiresCount", "umpireJobsCount", "umpireApplicationsCount"]),
    );
  });

  it("still selects the counts the dashboard already relied on", () => {
    expect(selected(ADMIN_DASHBOARD_STATS)).toEqual(
      expect.arrayContaining(["totalUsersCount", "playersCount", "coachesCount", "clubsCount", "superAdminsCount"]),
    );
  });
});

describe("ADMIN_USERS", () => {
  it("parses as valid GraphQL", () => {
    expect(() => print(parse(ADMIN_USERS))).not.toThrow();
  });

  it("selects the licence data an admin needs to verify an umpire", () => {
    expect(selected(ADMIN_USERS)).toEqual(
      expect.arrayContaining(["licenseLevel", "certifyingBody", "licenseNumber"]),
    );
  });

  it("still selects the columns the table relied on", () => {
    expect(selected(ADMIN_USERS)).toEqual(
      expect.arrayContaining(["id", "name", "email", "role", "isActive", "isVerified", "createdAt"]),
    );
  });
});

describe("ADMIN_CHANGE_USER_ROLE", () => {
  it("types the role as the strict Role enum (UMPIRE must be uppercase)", () => {
    const vars = operation(ADMIN_CHANGE_USER_ROLE).variableDefinitions!.map((v) => [
      v.variable.name.value,
      print(v.type),
    ]);
    expect(Object.fromEntries(vars)).toMatchObject({ role: "Role!" });
  });
});
