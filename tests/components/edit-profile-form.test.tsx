/**
 * What: Role routing tests for EditProfileForm.
 * Why: Each role edits different data (umpires licence data, clubs the club
 *      entity, players/coaches position and CV). Sending the wrong form to a
 *      role would either hide required fields or post fields the backend
 *      rejects (umpire fields on a non-umpire answer 400).
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EditProfileForm } from "@/components/profile/edit/edit-profile-form";
import { Role } from "@/types/enums";

const { state } = vi.hoisted(() => ({ state: { user: null as { role: string } | null } }));

vi.mock("@/stores/useAuthStore", () => ({
  useAuthStore: () => ({ user: state.user }),
}));

vi.mock("@/components/profile/edit/umpire-profile-form", () => ({
  UmpireProfileForm: () => <div>umpire-form</div>,
}));
vi.mock("@/components/profile/edit/club-profile-form", () => ({
  ClubProfileForm: () => <div>club-form</div>,
}));
vi.mock("@/components/profile/edit/player-coach-profile-form", () => ({
  PlayerCoachProfileForm: () => <div>player-coach-form</div>,
}));

describe("EditProfileForm", () => {
  it.each([
    [Role.UMPIRE, "umpire-form"],
    [Role.CLUB, "club-form"],
    [Role.PLAYER, "player-coach-form"],
    [Role.COACH, "player-coach-form"],
  ])("renders the right form for %s", (role, expected) => {
    state.user = { role };
    render(<EditProfileForm />);

    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("shows a loading state without a user", () => {
    state.user = null;
    render(<EditProfileForm />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
