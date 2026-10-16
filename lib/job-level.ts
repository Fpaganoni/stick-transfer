import { Level } from "@/types/enums";

function isKnownLevel(value: string): value is Level {
  return (Object.values(Level) as string[]).includes(value);
}

/**
 * Human label for the level of a vacancy, from the `opportunities` namespace. Older
 * opportunities may carry another casing or a value outside the enum; the first is
 * matched anyway and the second is shown as it is instead of a missing translation.
 */
export function getLevelLabel(t: (key: string) => string, level?: string | null): string {
  if (!level) return "";
  const upper = level.toUpperCase();
  return isKnownLevel(upper) ? t(`filters.levels.${upper}`) : level;
}
