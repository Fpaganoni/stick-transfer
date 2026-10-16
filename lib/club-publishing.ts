/**
 * Only a VERIFIED club may publish or reopen vacancies (PENDING, REJECTED and
 * UNVERIFIED may not). This mirrors the backend rule (CLUB_NOT_VERIFIED) so the UI
 * can say so up front; the backend stays the source of truth.
 */
export function canPublishVacancies(verificationStatus: string | null | undefined): boolean {
  return verificationStatus === "VERIFIED";
}
