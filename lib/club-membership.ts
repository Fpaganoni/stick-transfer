import type { Club } from "@/types/models/club";

/**
 * Is `userId` a full member of the club? A PENDING or REJECTED membership is
 * only an invitation or a refused request, so it does not make the club "mine".
 * `members` is whatever the list query loaded; absent means "not a member".
 */
export function isActiveMember(
  club: Pick<Club, "members">,
  userId: string | null | undefined,
): boolean {
  if (!userId) return false;
  return (club.members ?? []).some(
    (member) => member.user.id === userId && member.status === "ACTIVE",
  );
}
