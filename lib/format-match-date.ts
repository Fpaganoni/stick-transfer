/**
 * Formats a match date for display. Accepts an ISO string or a ms timestamp
 * (the backend has not confirmed which one it serializes). Returns "" when the
 * value is missing or not a date.
 */
export function formatMatchDate(
  value: string | number | null | undefined,
  locale: string,
): string {
  if (value === null || value === undefined || value === "") return "";
  const asNumber = Number(value);
  const date = new Date(Number.isNaN(asNumber) ? value : asNumber);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
