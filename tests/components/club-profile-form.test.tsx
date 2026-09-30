/**
 * What: Unit tests for ClubProfileForm.
 * Why: The edit-profile form is split by role (docs/ROLE_PERMISSIONS_PLAN.md) so a
 *      CLUB account never sees CV/trajectories/multimedia fields meant for
 *      PLAYER/COACH, and does see its own club-entity fields instead. A regression
 *      here would put those irrelevant fields back in front of club users.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClubProfileForm } from "@/components/profile/edit/club-profile-form";
import { Role } from "@/types/enums";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const mockUser = {
  id: "club-user-1",
  name: "HC Barcelona Admin",
  username: "hcbarcelona",
  email: "club@test.com",
  role: Role.CLUB,
  clubId: "club-1",
  avatar: "",
  coverImage: "",
  bio: "",
  country: "ES",
  city: "Barcelona",
};

const mockClub = {
  id: "club-1",
  name: "HC Barcelona",
  description: "A great club",
  logo: "",
  verificationStatus: "UNVERIFIED" as const,
  managedBy: { firstName: "Ana", lastName: "Garcia" },
};

vi.mock("@/stores/useAuthStore", () => ({
  useAuthStore: () => ({ user: mockUser, updateUser: vi.fn() }),
}));

vi.mock("@/hooks/useUsers", () => ({
  useUpdateUser: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock("@/hooks/useClubs", () => ({
  useClub: () => ({ data: { club: mockClub } }),
  useUpdateClub: () => ({ mutateAsync: vi.fn() }),
}));

describe("ClubProfileForm", () => {
  it("renders club-entity fields (name, description, managed-by)", () => {
    render(<ClubProfileForm />);

    expect(screen.getByText("editForm.club.title")).toBeInTheDocument();
    expect(screen.getByText("editForm.club.name")).toBeInTheDocument();
    expect(screen.getByText("editForm.club.managedByFirstName")).toBeInTheDocument();
    expect(screen.getByText("editForm.club.managedByLastName")).toBeInTheDocument();
    expect(screen.getByDisplayValue("HC Barcelona")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Ana")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Garcia")).toBeInTheDocument();
  });

  it("does NOT render player/coach-only fields (CV, trajectories, multimedia, position)", () => {
    render(<ClubProfileForm />);

    expect(screen.queryByText("cv.label")).not.toBeInTheDocument();
    expect(screen.queryByText("editForm.trajectories")).not.toBeInTheDocument();
    expect(screen.queryByText("editForm.multimedia")).not.toBeInTheDocument();
    expect(screen.queryByText("editForm.position")).not.toBeInTheDocument();
    expect(screen.queryByText("editForm.yearsOfExperience")).not.toBeInTheDocument();
  });

  it("renders the shared basic-info fields for the account owner", () => {
    render(<ClubProfileForm />);

    expect(screen.getByText("editForm.basicInfo")).toBeInTheDocument();
    expect(screen.getByDisplayValue("HC Barcelona Admin")).toBeInTheDocument();
  });
});
