"use client";

import { PublicUserProfilePage } from "@/components/pages/public-user-profile-page";
import { ClubProfileRoute } from "@/components/clubs/club-profile-route";
import { useAuthStore } from "@/stores/useAuthStore";
import { UserProfilePage } from "@/components/pages/user-profile-page";
import { ProfilePageSkeleton } from "@/components/profile/profile-page-skeleton";
import { useUserByUsername } from "@/hooks/useUsers";
import { Role } from "@/types/enums";

interface ProfileSlugWrapperProps {
  username: string;
}

/**
 * Picks the profile page for /profile/[...slug]. Someone else's profile waits
 * for its role (user vs club) behind a skeleton instead of rendering the user
 * layout first; the own profile needs no request.
 *
 * A CLUB account is the club itself, so it renders the same club profile as
 * /clubs/[id] (the club is fetched by its id, which is the account id).
 */
export function ProfileSlugWrapper({ username }: ProfileSlugWrapperProps) {
  const currentUser = useAuthStore((state) => state.user);
  const isOwnProfile = currentUser?.username === username;
  const { data, isLoading } = useUserByUsername(isOwnProfile ? null : username);

  if (isOwnProfile) {
    return currentUser?.role === Role.CLUB ? (
      <ClubProfileRoute clubId={currentUser.id} />
    ) : (
      <UserProfilePage isOwnProfile={true} />
    );
  }

  if (isLoading) return <ProfilePageSkeleton />;

  const profile = data?.getUserByUsername;

  // Not found / errors are handled by PublicUserProfilePage
  return profile?.role === Role.CLUB ? (
    <ClubProfileRoute clubId={profile.id} />
  ) : (
    <PublicUserProfilePage username={username} />
  );
}
