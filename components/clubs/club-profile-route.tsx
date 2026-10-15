"use client";

import { ClubProfileView } from "@/components/clubs/club-profile-view";
import { useAuthStore } from "@/stores/useAuthStore";

/**
 * Picks the mode for a club page: the club's own account sees the owner view,
 * everyone else the public one. The same component serves /profile, /clubs/[id]
 * and /profile/[username], so a club looks identical on all of them.
 */
export function ClubProfileRoute({ clubId }: { clubId: string }) {
  const viewerId = useAuthStore((state) => state.user?.id);

  return <ClubProfileView clubId={clubId} mode={viewerId === clubId ? "owner" : "public"} />;
}
