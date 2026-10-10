"use client";

import { UserProfilePage } from "@/components/pages/user-profile-page";
import { ClubProfilePage } from "@/components/pages/club-profile-page";
import { useAuthStore } from "@/stores/useAuthStore";
import { Role } from "@/types/enums";

export default function ProfileRoute() {
  const { user } = useAuthStore();

  return user?.role === Role.CLUB ? (
    <ClubProfilePage isOwnProfile={true} />
  ) : (
    <UserProfilePage isOwnProfile={true} />
  );
}
