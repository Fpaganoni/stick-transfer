import { z } from "zod";

/**
 * Same limits the backend enforces on `dateOfBirth`
 * (DATE_OF_BIRTH_TOO_YOUNG / DATE_OF_BIRTH_TOO_OLD). Someone who already
 * turned 100 is still valid; from 101 on they are rejected.
 */
export const MIN_AGE = 16;
export const MAX_AGE = 100;

/** Keys under `register.validation` in messages/{en,es,fr}.json. */
export type DobErrorKey = "dobInvalid" | "dobTooYoung" | "dobTooOld";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (n: number) => String(n).padStart(2, "0");

/** YYYY-MM-DD in local time; toISOString would shift the day across UTC. */
function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Same day `years` years earlier; Feb 29 clamps to Feb 28 in non-leap years. */
function yearsBefore(date: Date, years: number): Date {
  const year = date.getFullYear() - years;
  const month = date.getMonth();
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(date.getDate(), lastDayOfMonth));
}

/**
 * Oldest (`min`) and youngest (`max`) birth dates allowed today, ready for
 * the `min`/`max` attributes of an `<input type="date">`.
 */
export function getDobBounds(today: Date = new Date()): { min: string; max: string } {
  const max = yearsBefore(today, MIN_AGE);
  const firstTooOld = yearsBefore(today, MAX_AGE + 1);
  const min = new Date(
    firstTooOld.getFullYear(),
    firstTooOld.getMonth(),
    firstTooOld.getDate() + 1,
  );
  return { min: toIsoDate(min), max: toIsoDate(max) };
}

function isRealDate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
  );
}

/**
 * Validation key for a YYYY-MM-DD birth date, or null when it is valid.
 * An empty value is valid: the field is optional and gets omitted on submit.
 */
export function getDobErrorKey(
  value: string | undefined,
  today: Date = new Date(),
): DobErrorKey | null {
  if (!value) return null;
  if (!isRealDate(value)) return "dobInvalid";

  // YYYY-MM-DD strings compare correctly as plain strings.
  const { min, max } = getDobBounds(today);
  if (value > max) return "dobTooYoung";
  if (value < min) return "dobTooOld";
  return null;
}

/** Optional `dateOfBirth` field shared by every step 3 schema that asks for it. */
export function dateOfBirthSchema(t: (key: DobErrorKey) => string) {
  return z
    .string()
    .optional()
    .superRefine((value, ctx) => {
      const key = getDobErrorKey(value);
      if (key) ctx.addIssue({ code: z.ZodIssueCode.custom, message: t(key) });
    });
}
