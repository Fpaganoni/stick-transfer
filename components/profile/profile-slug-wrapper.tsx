"use client";

import { AppShell } from "@/components/layout/app-shell";
import { PublicUserProfilePage } from "@/components/pages/public-user-profile-page";
import { PublicClubProfilePage } from "@/components/pages/public-club-profile-page";
import { useAuthStore } from "@/stores/useAuthStore";
import { UserProfilePage } from "@/components/pages/user-profile-page";
import { ClubProfilePage } from "@/components/pages/club-profile-page";
import { useUserByUsername } from "@/hooks/useUsers";
import { Role } from "@/types/enums";

interface ProfileSlugWrapperProps {
  username: string;
}

export function ProfileSlugWrapper({ username }: ProfileSlugWrapperProps) {
  const { user: currentUser } = useAuthStore();
  const { data } = useUserByUsername(username);
  const isOwnProfile = currentUser?.username === username;

  return (
    <AppShell title={isOwnProfile ? "My Profile" : username}>
      {isOwnProfile ? (
        currentUser?.role === Role.CLUB_ADMIN ? (
          <ClubProfilePage isOwnProfile={true} />
        ) : (
          <UserProfilePage isOwnProfile={true} />
        )
      ) : data?.getUserByUsername?.role === Role.CLUB_ADMIN ? (
        <PublicClubProfilePage username={username} />
      ) : (
        <PublicUserProfilePage username={username} />
      )}
    </AppShell>
  );
}
