import { describe, it, expect } from "vitest";
import { parseApiError } from "@/lib/auth-errors";

function apiError(extensions: Record<string, unknown>) {
  return { response: { errors: [{ message: "x", extensions }] } };
}

describe("parseApiError", () => {
  it("recognizes CLUB_NAME_TAKEN with the field it points at", () => {
    expect(parseApiError(apiError({ code: "CLUB_NAME_TAKEN", field: "clubName" }))).toEqual({
      code: "CLUB_NAME_TAKEN",
      fields: [],
      field: "clubName",
    });
  });

  it.each([
    "JOB_HAS_UNANSWERED_APPLICATIONS",
    "JOB_FILLED_COOLDOWN",
    "ROLE_CHANGE_NOT_ALLOWED",
    "ACTIVE_JOBS_LIMIT_REACHED",
    "CLUB_NOT_VERIFIED",
  ])(
    "recognizes %s",
    (code) => {
      expect(parseApiError(apiError({ code })).code).toBe(code);
    },
  );

  it("falls back to UNKNOWN for a code it does not know", () => {
    expect(parseApiError(apiError({ code: "SOMETHING_NEW" })).code).toBe("UNKNOWN");
  });

  it("reports NETWORK_ERROR when there is no response", () => {
    expect(parseApiError(new Error("offline")).code).toBe("NETWORK_ERROR");
  });
});
