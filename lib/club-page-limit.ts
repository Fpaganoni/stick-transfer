/** A club never asks for, or receives, more than one backend page of vacancies or applications. */
export const CLUB_PAGE_LIMIT = 100;

/**
 * A list that came back with a full page may have more rows behind it. The UI says so
 * instead of letting the owner read it as "this is everything".
 */
export function mayBeTruncated(count: number): boolean {
  return count >= CLUB_PAGE_LIMIT;
}
