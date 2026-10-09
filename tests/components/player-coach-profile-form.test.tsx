/**
 * What: Unit tests for PlayerCoachProfileForm.
 * Why: The backend only stores `position` for PLAYER and answers anything that
 *      is not a Position value with POSITION_INVALID. Coaches must not see or
 *      send a position, and players pick it from the enum instead of free text.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlayerCoachProfileForm } from "@/components/profile/edit/player-coach-profile-form";
import { Role } from "@/types/enums";

const { state, mockUpdateProfile } = vi.hoisted(() => ({
  state: { user: null as Record<string, unknown> | null },
  mockUpdateProfile: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/stores/useAuthStore", () => ({
  useAuthStore: () => ({ user: state.user, updateUser: vi.fn() }),
}));

vi.mock("@/hooks/useUsers", () => ({
  useUpdateUser: () => ({ mutateAsync: mockUpdateProfile }),
  useUploadCv: () => ({ mutateAsync: vi.fn() }),
  useDeleteCv: () => ({ mutateAsync: vi.fn() }),
}));

function makeUser(role: Role, position?: string) {
  return {
    id: "user-1",
    name: "Ana Garcia",
    username: "ana_garcia",
    email: "ana@test.com",
    role,
    position,
    yearsOfExperience: 5,
    trajectories: [],
    multimedia: [],
  };
}

describe("PlayerCoachProfileForm", () => {
  beforeEach(() => {
    mockUpdateProfile.mockReset();
    mockUpdateProfile.mockResolvedValue({});
  });

  describe("as a COACH", () => {
    beforeEach(() => {
      state.user = makeUser(Role.COACH, "attacker");
    });

    it("does not show the position field but keeps years of experience", () => {
      render(<PlayerCoachProfileForm />);

      expect(screen.queryByText("editForm.position")).not.toBeInTheDocument();
      expect(screen.getByText("editForm.yearsOfExperience")).toBeInTheDocument();
    });

    it("never sends a position when saving", async () => {
      const user = userEvent.setup();
      render(<PlayerCoachProfileForm />);

      await user.click(screen.getByText("editForm.saveChanges"));

      await waitFor(() => expect(mockUpdateProfile).toHaveBeenCalledTimes(1));
      expect(mockUpdateProfile.mock.calls[0][0]).not.toHaveProperty("position");
    });
  });

  describe("as a PLAYER", () => {
    it("shows the position as a select with the translated current value", () => {
      state.user = makeUser(Role.PLAYER, "attacker");
      render(<PlayerCoachProfileForm />);

      expect(screen.getByText("editForm.position")).toBeInTheDocument();
      expect(screen.getByRole("combobox")).toHaveTextContent("positions.forward");
    });

    it("shows the placeholder for a legacy free-text position", () => {
      state.user = makeUser(Role.PLAYER, "Forward");
      render(<PlayerCoachProfileForm />);

      expect(screen.getByRole("combobox")).toHaveTextContent(
        "editForm.placeholders.position",
      );
    });

    it("sends the selected position when saving", async () => {
      state.user = makeUser(Role.PLAYER, "defender");
      const user = userEvent.setup();
      render(<PlayerCoachProfileForm />);

      await user.click(screen.getByText("editForm.saveChanges"));

      await waitFor(() => expect(mockUpdateProfile).toHaveBeenCalledTimes(1));
      expect(mockUpdateProfile.mock.calls[0][0]).toMatchObject({ position: "defender" });
    });

    it("omits an empty position instead of sending an invalid one", async () => {
      state.user = makeUser(Role.PLAYER, "Forward");
      const user = userEvent.setup();
      render(<PlayerCoachProfileForm />);

      await user.click(screen.getByText("editForm.saveChanges"));

      await waitFor(() => expect(mockUpdateProfile).toHaveBeenCalledTimes(1));
      expect(mockUpdateProfile.mock.calls[0][0]).not.toHaveProperty("position");
    });
  });
});
