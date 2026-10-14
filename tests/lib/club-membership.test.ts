import { describe, expect, it } from "vitest";
import { isActiveMember } from "@/lib/club-membership";

const member = (userId: string, status: string) => ({
  id: `m-${userId}`,
  role: "PLAYER",
  status,
  user: { id: userId, username: userId, name: userId },
});

describe("isActiveMember", () => {
  it("is true for an ACTIVE membership of the user", () => {
    expect(isActiveMember({ members: [member("u1", "ACTIVE")] }, "u1")).toBe(true);
  });

  it.each(["PENDING", "REJECTED"])("is false while the membership is %s", (status) => {
    expect(isActiveMember({ members: [member("u1", status)] }, "u1")).toBe(false);
  });

  it("is false when only other users are members", () => {
    expect(isActiveMember({ members: [member("u2", "ACTIVE")] }, "u1")).toBe(false);
  });

  it.each([undefined, null, ""])("is false without a signed-in user (%p)", (userId) => {
    expect(isActiveMember({ members: [member("u1", "ACTIVE")] }, userId)).toBe(false);
  });

  it("is false when the club has no members loaded", () => {
    expect(isActiveMember({}, "u1")).toBe(false);
    expect(isActiveMember({ members: [] }, "u1")).toBe(false);
  });
});
