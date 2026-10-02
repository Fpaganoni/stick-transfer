/**
 * Position types accepted by the backend for job opportunities. Any other
 * value is rejected with a 400 ("Invalid positionType"), on create and on filters.
 */
export const POSITION_TYPES = ["PLAYER", "COACH", "STAFF", "UMPIRE", "OTHER"] as const;

export type PositionType = (typeof POSITION_TYPES)[number];

export const UMPIRE_POSITION_TYPE: PositionType = "UMPIRE";

/** Case-insensitive: the backend accepts "umpire" and returns the stored casing. */
export function isUmpireJob(positionType?: string | null): boolean {
  return positionType?.toUpperCase() === UMPIRE_POSITION_TYPE;
}

function isKnownPositionType(value: string): value is PositionType {
  return (POSITION_TYPES as readonly string[]).includes(value);
}

/**
 * Human label for a stored position type. Older opportunities may carry values
 * outside the enum; those are shown as they are instead of a missing translation.
 */
export function getPositionTypeLabel(
  t: (key: string) => string,
  positionType?: string | null,
): string {
  if (!positionType) return "";
  const upper = positionType.toUpperCase();
  return isKnownPositionType(upper) ? t(`positionTypes.${upper}`) : positionType;
}
