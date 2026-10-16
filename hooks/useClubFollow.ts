import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useFollow, useUnfollow } from "@/hooks/useUsers";
import { useAuthStore } from "@/stores/useAuthStore";
import { followerTypeFor } from "@/lib/follow-axis";
import type { Club } from "@/types/models/club";

/**
 * Follow / unfollow a club.
 *
 * A club account has two social axes with the same id (USER and CLUB) and the
 * backend keeps one counter per axis. The front only ever uses the CLUB axis
 * for a club, so every follower lands on the same counter. A viewer that is a
 * club account follows as a CLUB too.
 */
export function useClubFollow(club: Pick<Club, "id" | "isFollowedByCurrentUser"> | undefined) {
  const t = useTranslations("clubProfile.header");
  const currentUser = useAuthStore((state) => state.user);
  const followMutation = useFollow();
  const unfollowMutation = useUnfollow();

  const isFollowing = Boolean(club?.isFollowedByCurrentUser);
  // A club cannot follow itself, and following needs a session
  const canFollow = !!currentUser && !!club && currentUser.id !== club.id;

  const toggle = () => {
    if (!canFollow || !currentUser || !club) return;
    const variables = {
      followerType: followerTypeFor(currentUser.role),
      followerId: currentUser.id,
      followingType: "CLUB",
      followingId: club.id,
    };
    const mutation = isFollowing ? unfollowMutation : followMutation;
    mutation.mutate(variables, {
      onSuccess: () => toast.success(t(isFollowing ? "unfollowed" : "followed")),
      onError: () => toast.error(t("followError")),
    });
  };

  return {
    isFollowing,
    canFollow,
    isPending: followMutation.isPending || unfollowMutation.isPending,
    toggle,
  };
}
