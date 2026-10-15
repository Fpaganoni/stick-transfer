"use client";

import { UserProfilePage } from "@/components/pages/user-profile-page";
import { ClubProfileRoute } from "@/components/clubs/club-profile-route";
import { useAuthStore } from "@/stores/useAuthStore";
import { Role } from "@/types/enums";

export default function ProfileRoute() {
  const { user } = useAuthStore();

  // A CLUB account is the club itself: its profile is the club, never a person
  return user?.role === Role.CLUB ? (
    <ClubProfileRoute clubId={user.id} />
  ) : (
    <UserProfilePage isOwnProfile={true} />
  );
}
