"use client";

import { useAuthStore } from "@/stores/useAuthStore";
import { Role } from "@/types/enums";
import { PlayerCoachProfileForm } from "./player-coach-profile-form";
import { ClubProfileForm } from "./club-profile-form";

/**
 * Renders the profile edit form for the logged-in user's role: clubs edit
 * club-entity fields (name, logo, admin contact), players/coaches edit
 * position, CV and trajectories. See docs/ROLE_PERMISSIONS_PLAN.md.
 */
export function EditProfileForm() {
  const { user } = useAuthStore();

  if (!user) {
    return <div>Loading...</div>;
  }

  if (user.role === Role.CLUB) {
    return <ClubProfileForm />;
  }

  return <PlayerCoachProfileForm />;
}
