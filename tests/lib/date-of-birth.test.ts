/**
 * What: Unit tests for the date of birth bounds and validation helpers.
 * Why: The backend rejects anyone younger than 16 or older than 100
 *      (DATE_OF_BIRTH_TOO_YOUNG / DATE_OF_BIRTH_TOO_OLD) and answers an empty
 *      string with DATE_OF_BIRTH_INVALID, so the form must agree on the exact
 *      edges and treat "no date" as "omit the field".
 */
import { describe, it, expect } from "vitest";
import {
  MIN_AGE,
  MAX_AGE,
  getDobBounds,
  getDobErrorKey,
  dateOfBirthSchema,
} from "@/lib/date-of-birth";

// Local dates: month is 0-based.
const TODAY = new Date(2026, 9, 9);
const LEAP_DAY = new Date(2028, 1, 29);

describe("age limits", () => {
  it("match the backend (16 to 100 years)", () => {
    expect(MIN_AGE).toBe(16);
    expect(MAX_AGE).toBe(100);
  });
});

describe("getDobBounds", () => {
  it("returns the oldest and youngest allowed birth dates as YYYY-MM-DD", () => {
    expect(getDobBounds(TODAY)).toEqual({ min: "1925-10-10", max: "2010-10-09" });
  });

  it("does not roll Feb 29 into March when the target year is not leap", () => {
    expect(getDobBounds(LEAP_DAY)).toEqual({ min: "1927-03-01", max: "2012-02-29" });
  });
});

describe("getDobErrorKey", () => {
  it.each([undefined, ""])("accepts a missing date (%s)", (value) => {
    expect(getDobErrorKey(value, TODAY)).toBeNull();
  });

  it.each(["2010-10-09", "1925-10-10", "1990-05-20"])("accepts %s", (value) => {
    expect(getDobErrorKey(value, TODAY)).toBeNull();
  });

  it.each(["2010-10-10", "2026-10-09", "2030-01-01"])(
    "rejects %s as too young",
    (value) => {
      expect(getDobErrorKey(value, TODAY)).toBe("dobTooYoung");
    },
  );

  it.each(["1925-10-09", "1800-01-01"])("rejects %s as too old", (value) => {
    expect(getDobErrorKey(value, TODAY)).toBe("dobTooOld");
  });

  it.each(["abc", "2020-02-30", "1990-13-01", "1990-1-1", "19900101"])(
    "rejects %s as invalid",
    (value) => {
      expect(getDobErrorKey(value, TODAY)).toBe("dobInvalid");
    },
  );
});

describe("dateOfBirthSchema", () => {
  const schema = dateOfBirthSchema((key) => `msg:${key}`);

  it("passes an empty or missing value", () => {
    expect(schema.safeParse("").success).toBe(true);
    expect(schema.safeParse(undefined).success).toBe(true);
  });

  it("fails with the translated message for an out of range date", () => {
    const result = schema.safeParse("1800-01-01");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("msg:dobTooOld");
  });
});
