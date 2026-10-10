"use client";

import { PublicUserProfilePage } from "@/components/pages/public-user-profile-page";
import { PublicClubProfilePage } from "@/components/pages/public-club-profile-page";
import { useAuthStore } from "@/stores/useAuthStore";
import { UserProfilePage } from "@/components/pages/user-profile-page";
import { ClubProfilePage } from "@/components/pages/club-profile-page";
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
 */
export function ProfileSlugWrapper({ username }: ProfileSlugWrapperProps) {
  const currentUser = useAuthStore((state) => state.user);
  const isOwnProfile = currentUser?.username === username;
  const { data, isLoading } = useUserByUsername(isOwnProfile ? null : username);

  if (isOwnProfile) {
    return currentUser?.role === Role.CLUB ? (
      <ClubProfilePage isOwnProfile={true} />
    ) : (
      <UserProfilePage isOwnProfile={true} />
    );
  }

  if (isLoading) return <ProfilePageSkeleton />;

  // Not found / errors are handled by PublicUserProfilePage
  return data?.getUserByUsername?.role === Role.CLUB ? (
    <PublicClubProfilePage username={username} />
  ) : (
    <PublicUserProfilePage username={username} />
  );
}
