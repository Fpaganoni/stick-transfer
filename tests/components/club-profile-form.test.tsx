/**
 * What: Unit tests for ClubProfileForm.
 * Why: The edit-profile form is split by role (docs/ROLE_PERMISSIONS_PLAN.md) so a
 *      CLUB account never sees CV/trajectories/multimedia fields meant for
 *      PLAYER/COACH, and does see its own club-entity fields instead. A regression
 *      here would put those irrelevant fields back in front of club users.
 *      The "contact and social" card is the only place a club can set the
 *      website/email/phone/socials shown on its public page, so it must send
 *      them to updateClub normalized (bare handles, https website).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClubProfileForm } from "@/components/profile/edit/club-profile-form";
import { Role } from "@/types/enums";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

const mocks = vi.hoisted(() => ({
  updateClub: vi.fn(),
  updateProfile: vi.fn(),
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
  website: "https://hcbarcelona.com",
  instagram: "hcbarcelona",
};

vi.mock("@/stores/useAuthStore", () => ({
  useAuthStore: () => ({ user: mockUser, updateUser: vi.fn() }),
}));

vi.mock("@/hooks/useUsers", () => ({
  useUpdateUser: () => ({ mutateAsync: mocks.updateProfile }),
}));

vi.mock("@/hooks/useClubs", () => ({
  useClub: () => ({ data: { club: mockClub } }),
  useUpdateClub: () => ({ mutateAsync: mocks.updateClub }),
}));

describe("ClubProfileForm", () => {
  beforeEach(() => {
    mocks.updateClub.mockReset().mockResolvedValue({});
    mocks.updateProfile.mockReset().mockResolvedValue({});
  });

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

  it("renders the contact and social card with the stored club values", () => {
    render(<ClubProfileForm />);

    expect(screen.getByText("editForm.club.contact.title")).toBeInTheDocument();
    expect(screen.getByLabelText("editForm.club.contact.website")).toHaveValue(
      "https://hcbarcelona.com",
    );
    expect(screen.getByLabelText("editForm.club.contact.instagram")).toHaveValue(
      "hcbarcelona",
    );
    expect(screen.getByLabelText("editForm.club.contact.tiktok")).toHaveValue("");
  });

  it("saves contact fields and socials normalized through updateClub", async () => {
    const user = userEvent.setup();
    render(<ClubProfileForm />);

    const website = screen.getByLabelText("editForm.club.contact.website");
    await user.clear(website);
    await user.type(website, "hcbarcelona.es");
    await user.type(screen.getByLabelText("editForm.club.contact.email"), "info@hcbarcelona.es");
    await user.type(screen.getByLabelText("editForm.club.contact.phone"), "+34 600 123 456");
    await user.type(screen.getByLabelText("editForm.club.contact.twitter"), "@hcbarcelona");
    await user.type(
      screen.getByLabelText("editForm.club.contact.tiktok"),
      "https://www.tiktok.com/@hcbarcelona",
    );
    await user.click(screen.getByRole("button", { name: "editForm.saveChanges" }));

    await waitFor(() => expect(mocks.updateClub).toHaveBeenCalledTimes(1));
    expect(mocks.updateClub).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "club-1",
        website: "https://hcbarcelona.es",
        email: "info@hcbarcelona.es",
        phone: "+34 600 123 456",
        instagram: "hcbarcelona",
        twitter: "hcbarcelona",
        facebook: "",
        tiktok: "hcbarcelona",
      }),
    );
  });

  it("blocks the save and shows errors for an invalid email or handle", async () => {
    const user = userEvent.setup();
    render(<ClubProfileForm />);

    await user.type(screen.getByLabelText("editForm.club.contact.email"), "not-an-email");
    await user.type(
      screen.getByLabelText("editForm.club.contact.facebook"),
      "https://instagram.com/hcbarcelona",
    );
    await user.click(screen.getByRole("button", { name: "editForm.saveChanges" }));

    expect(
      await screen.findByText("editForm.club.contact.validation.emailInvalid"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("editForm.club.contact.validation.handleInvalid"),
    ).toBeInTheDocument();
    expect(mocks.updateClub).not.toHaveBeenCalled();
  });
});
