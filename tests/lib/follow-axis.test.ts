/**
 * What: Tests for followerTypeFor, the social axis a viewer acts on.
 * Why: A club account follows (and is followed) only on the CLUB axis, while a
 *      person uses USER. Every follow call must decide the axis the same way, so
 *      a club never leaves a second, USER-axis row behind.
 */
import { describe, it, expect } from "vitest";
import { followerTypeFor } from "@/lib/follow-axis";
import { Role } from "@/types/enums";

describe("followerTypeFor", () => {
  it("acts as a CLUB when the viewer is a club account", () => {
    expect(followerTypeFor(Role.CLUB)).toBe("CLUB");
  });

  it.each([Role.PLAYER, Role.COACH, Role.UMPIRE, Role.SUPERADMIN])(
    "acts as a USER for a %s",
    (role) => {
      expect(followerTypeFor(role)).toBe("USER");
    },
  );

  it("acts as a USER when the role is unknown", () => {
    expect(followerTypeFor(undefined)).toBe("USER");
  });
});
