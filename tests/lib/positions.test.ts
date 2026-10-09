/**
 * What: Unit tests for the shared position options.
 * Why: Register, profile edit and the explore filter all send `position` to the
 *      backend, which only accepts Position enum values (POSITION_INVALID
 *      otherwise) and no longer matches "Forward" with "attacker". One list
 *      keeps the three screens from drifting apart.
 */
import { describe, it, expect } from "vitest";
import { POSITION_OPTIONS, toKnownPosition } from "@/lib/positions";
import { Position } from "@/types/enums";

describe("POSITION_OPTIONS", () => {
  it("covers every Position enum value exactly once", () => {
    const values = POSITION_OPTIONS.map((option) => option.value);
    expect([...values].sort()).toEqual([...Object.values(Position)].sort());
  });

  it("labels attacker as forward (explore.positions.forward)", () => {
    const attacker = POSITION_OPTIONS.find((o) => o.value === Position.ATTACKER);
    expect(attacker?.labelKey).toBe("forward");
  });
});

describe("toKnownPosition", () => {
  it.each(Object.values(Position))("keeps the enum value %s", (value) => {
    expect(toKnownPosition(value)).toBe(value);
  });

  it.each([undefined, "", "Forward", "Attacker", "striker"])(
    "turns %s into an empty value",
    (value) => {
      expect(toKnownPosition(value)).toBe("");
    },
  );
});
