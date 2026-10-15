/** What a CLUB account still has to fill in so its public profile is useful. */
export type ClubProfileMissingField = "crest" | "description";

export interface ClubProfileCompleteness {
  isComplete: boolean;
  missing: ClubProfileMissingField[];
}

interface ClubProfileCompletenessInput {
  /** Club crest: the owner User.avatar. */
  logo?: string | null;
  description?: string | null;
}

function hasText(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function getClubProfileCompleteness(
  club: ClubProfileCompletenessInput | null | undefined,
): ClubProfileCompleteness {
  const missing: ClubProfileMissingField[] = [];
  if (!hasText(club?.logo)) missing.push("crest");
  if (!hasText(club?.description)) missing.push("description");
  return { isComplete: missing.length === 0, missing };
}
