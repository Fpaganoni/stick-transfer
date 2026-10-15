/**
 * What: Unit tests for ClubProfileForm, the one form of a club.
 * Why: A CLUB account is the club: name, crest, cover, bio and place belong to
 *      the club itself, not to a second "personal" profile. The form saves with
 *      ONE updateClub call, never sends a field of a person (the backend does
 *      not reject them yet for a club and would store them), shows a taken club
 *      name on the name field, and reminds a new club to add its crest and
 *      description. The "contact and social" card is the only place a club sets
 *      the links shown on its public page, so it must send them normalized.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClubProfileForm } from "@/components/profile/edit/club-profile-form";
import { Role } from "@/types/enums";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  updateClub: vi.fn(),
  updateUser: vi.fn(),
  useClub: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("sonner", () => ({
  toast: { error: mocks.toastError, success: mocks.toastSuccess },
}));

const mockUser = {
  id: "club-user-1",
  // Identity of the account: the same name and crest the club shows
  name: "HC Barcelona",
  username: "hcbarcelona",
  email: "club@test.com",
  role: Role.CLUB,
  clubId: undefined,
  avatar: "",
  coverImage: "",
  bio: "",
  country: "ES",
  city: "Barcelona",
};

const mockClub = {
  id: "club-user-1",
  name: "HC Barcelona",
  description: "A great club",
  bio: "Since 1950",
  logo: "https://res.cloudinary.com/demo/crest.png",
  coverImage: "https://res.cloudinary.com/demo/cover.jpg",
  city: "Barcelona",
  country: "ES",
  league: "Primera",
  foundedYear: 1950,
  benefits: ["Housing"],
  verificationStatus: "UNVERIFIED" as const,
  managedBy: { firstName: "Ana", lastName: "Garcia" },
  website: "https://hcbarcelona.com",
  instagram: "hcbarcelona",
  user: { id: "club-user-1", username: "hcbarcelona" },
};

vi.mock("@/stores/useAuthStore", () => ({
  useAuthStore: () => ({ user: mockUser, updateUser: mocks.updateUser }),
}));

// The club form must not use updateUser: this fails loudly if it ever does
vi.mock("@/hooks/useUsers", () => ({
  useUpdateUser: () => {
    throw new Error("ClubProfileForm must save with a single updateClub call");
  },
}));

vi.mock("@/hooks/useClubs", () => ({
  useClub: mocks.useClub,
  useUpdateClub: () => ({ mutateAsync: mocks.updateClub }),
}));

function backendError(extensions: Record<string, unknown>) {
  return { response: { errors: [{ message: "x", extensions }] } };
}

const save = () => screen.getByRole("button", { name: "editForm.saveChanges" });

describe("ClubProfileForm", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.useClub.mockReturnValue({ data: { club: mockClub } });
    mocks.updateClub.mockResolvedValue({
      updateClub: {
        ...mockClub,
        user: { id: "club-user-1", username: "hcbarcelona", name: "HC Barcelona", avatar: mockClub.logo, coverImage: mockClub.coverImage },
      },
    });
  });

  describe("what it shows", () => {
    it("loads the club of the account itself (a CLUB user is the club)", () => {
      render(<ClubProfileForm />);

      expect(mocks.useClub).toHaveBeenCalledWith("club-user-1");
    });

    it("renders the identity of the club: name, username, crest, cover and bio", () => {
      render(<ClubProfileForm />);

      expect(screen.getByLabelText("editForm.club.name")).toHaveValue("HC Barcelona");
      expect(screen.getByLabelText("editForm.username")).toHaveValue("hcbarcelona");
      expect(screen.getByLabelText("editForm.bio")).toHaveValue("Since 1950");
      expect(screen.getByText("editForm.club.crest")).toBeInTheDocument();
      expect(screen.getByText("editForm.club.cover")).toBeInTheDocument();
    });

    it("renders the club details, the contact card and the private person in charge", () => {
      render(<ClubProfileForm />);

      expect(screen.getByLabelText("editForm.club.description")).toHaveValue("A great club");
      expect(screen.getByLabelText("editForm.club.league")).toHaveValue("Primera");
      expect(screen.getByLabelText("editForm.club.foundedYear")).toHaveValue("1950");
      expect(screen.getByLabelText("editForm.club.benefits")).toHaveValue("Housing");
      expect(screen.getByLabelText("editForm.club.contact.website")).toHaveValue(
        "https://hcbarcelona.com",
      );
      expect(screen.getByDisplayValue("Ana")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Garcia")).toBeInTheDocument();
      expect(screen.getByText("editForm.club.managedByDesc")).toBeInTheDocument();
    });

    it("does not duplicate the identity in a second, personal block", () => {
      render(<ClubProfileForm />);

      expect(screen.queryByText("editForm.basicInfo")).not.toBeInTheDocument();
      expect(screen.getAllByLabelText("editForm.club.name")).toHaveLength(1);
      expect(screen.queryByText("editForm.avatarUrl")).not.toBeInTheDocument();
    });

    it("does NOT render player/coach-only fields (CV, trajectories, multimedia, position)", () => {
      render(<ClubProfileForm />);

      expect(screen.queryByText("cv.label")).not.toBeInTheDocument();
      expect(screen.queryByText("editForm.trajectories")).not.toBeInTheDocument();
      expect(screen.queryByText("editForm.multimedia")).not.toBeInTheDocument();
      expect(screen.queryByText("editForm.position")).not.toBeInTheDocument();
      expect(screen.queryByText("editForm.yearsOfExperience")).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/dateOfBirth/)).not.toBeInTheDocument();
    });
  });

  describe("onboarding", () => {
    it("reminds a new club to add its crest and description, without a link to this page", () => {
      mocks.useClub.mockReturnValue({
        data: { club: { ...mockClub, logo: "", description: "" } },
      });

      render(<ClubProfileForm />);

      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.getByText("missing.crest")).toBeInTheDocument();
      expect(screen.getByText("missing.description")).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "action" })).not.toBeInTheDocument();
    });

    it("shows no reminder once the club is complete", () => {
      render(<ClubProfileForm />);

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });

  describe("saving", () => {
    it("saves identity and club data with ONE updateClub call", async () => {
      const user = userEvent.setup();
      render(<ClubProfileForm />);

      const name = screen.getByLabelText("editForm.club.name");
      await user.clear(name);
      await user.type(name, "HC Barcelona 1950");
      await user.click(save());

      await waitFor(() => expect(mocks.updateClub).toHaveBeenCalledTimes(1));
      expect(mocks.updateClub).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "club-user-1",
          name: "HC Barcelona 1950",
          username: "hcbarcelona",
          bio: "Since 1950",
          logo: "https://res.cloudinary.com/demo/crest.png",
          coverImage: "https://res.cloudinary.com/demo/cover.jpg",
          city: "Barcelona",
          country: "ES",
          description: "A great club",
          league: "Primera",
          foundedYear: 1950,
          benefits: ["Housing"],
          managedByFirstName: "Ana",
          managedByLastName: "Garcia",
        }),
      );
    });

    it("never sends a field of a person", async () => {
      const user = userEvent.setup();
      render(<ClubProfileForm />);

      await user.click(save());

      await waitFor(() => expect(mocks.updateClub).toHaveBeenCalledTimes(1));
      const sent = Object.keys(mocks.updateClub.mock.calls[0][0]);
      for (const forbidden of ["avatar", "dateOfBirth", "cvUrl", "position", "trajectories", "multimedia"]) {
        expect(sent).not.toContain(forbidden);
      }
    });

    it("splits the benefits typed as text into a list", async () => {
      const user = userEvent.setup();
      render(<ClubProfileForm />);

      const benefits = screen.getByLabelText("editForm.club.benefits");
      await user.clear(benefits);
      await user.type(benefits, "Housing, Meals, Car");
      await user.click(save());

      await waitFor(() => expect(mocks.updateClub).toHaveBeenCalledTimes(1));
      expect(mocks.updateClub.mock.calls[0][0].benefits).toEqual(["Housing", "Meals", "Car"]);
    });

    it("updates the session with the saved identity and goes back to the profile", async () => {
      const user = userEvent.setup();
      render(<ClubProfileForm />);

      await user.click(save());

      await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/profile"));
      expect(mocks.updateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "HC Barcelona",
          username: "hcbarcelona",
          avatar: "https://res.cloudinary.com/demo/crest.png",
          coverImage: "https://res.cloudinary.com/demo/cover.jpg",
        }),
      );
      expect(mocks.toastSuccess).toHaveBeenCalled();
    });

    it("saves contact fields and socials normalized", async () => {
      const user = userEvent.setup();
      render(<ClubProfileForm />);

      const website = screen.getByLabelText("editForm.club.contact.website");
      await user.clear(website);
      await user.type(website, "hcbarcelona.es");
      await user.type(screen.getByLabelText("editForm.club.contact.email"), "info@hcbarcelona.es");
      await user.type(screen.getByLabelText("editForm.club.contact.twitter"), "@hcbarcelona");
      await user.type(
        screen.getByLabelText("editForm.club.contact.tiktok"),
        "https://www.tiktok.com/@hcbarcelona",
      );
      await user.click(save());

      await waitFor(() => expect(mocks.updateClub).toHaveBeenCalledTimes(1));
      expect(mocks.updateClub).toHaveBeenCalledWith(
        expect.objectContaining({
          website: "https://hcbarcelona.es",
          email: "info@hcbarcelona.es",
          instagram: "hcbarcelona",
          twitter: "hcbarcelona",
          facebook: "",
          tiktok: "hcbarcelona",
        }),
      );
    });
  });

  describe("validation", () => {
    it("blocks the save and shows errors for an invalid email or handle", async () => {
      const user = userEvent.setup();
      render(<ClubProfileForm />);

      await user.type(screen.getByLabelText("editForm.club.contact.email"), "not-an-email");
      await user.type(
        screen.getByLabelText("editForm.club.contact.facebook"),
        "https://instagram.com/hcbarcelona",
      );
      await user.click(save());

      expect(
        await screen.findByText("editForm.club.contact.validation.emailInvalid"),
      ).toBeInTheDocument();
      expect(screen.getByText("editForm.club.contact.validation.handleInvalid")).toBeInTheDocument();
      expect(mocks.updateClub).not.toHaveBeenCalled();
    });

    it("blocks the save for a founded year that is not a year", async () => {
      const user = userEvent.setup();
      render(<ClubProfileForm />);

      const year = screen.getByLabelText("editForm.club.foundedYear");
      await user.clear(year);
      await user.type(year, "12");
      await user.click(save());

      expect(await screen.findByText("editForm.club.validation.foundedYearInvalid")).toBeInTheDocument();
      expect(mocks.updateClub).not.toHaveBeenCalled();
    });

    it("requires the club name and the person in charge", async () => {
      const user = userEvent.setup();
      render(<ClubProfileForm />);

      await user.clear(screen.getByLabelText("editForm.club.name"));
      await user.clear(screen.getByDisplayValue("Ana"));
      await user.click(save());

      expect(await screen.findByText("editForm.club.validation.nameMin")).toBeInTheDocument();
      expect(
        screen.getByText("editForm.club.validation.managedByFirstNameRequired"),
      ).toBeInTheDocument();
      expect(mocks.updateClub).not.toHaveBeenCalled();
    });
  });

  describe("when the backend refuses", () => {
    it("shows CLUB_NAME_TAKEN on the club name field and does not leave the page", async () => {
      mocks.updateClub.mockRejectedValue(backendError({ code: "CLUB_NAME_TAKEN", field: "name" }));
      const user = userEvent.setup();
      render(<ClubProfileForm />);

      await user.click(save());

      expect(
        await screen.findByText("editForm.club.serverErrors.clubNameTaken"),
      ).toBeInTheDocument();
      expect(mocks.push).not.toHaveBeenCalled();
      expect(mocks.updateUser).not.toHaveBeenCalled();
      expect(mocks.toastError).not.toHaveBeenCalled();
    });

    it("shows USERNAME_TAKEN on the username field", async () => {
      mocks.updateClub.mockRejectedValue(backendError({ code: "USERNAME_TAKEN", field: "username" }));
      const user = userEvent.setup();
      render(<ClubProfileForm />);

      await user.click(save());

      expect(
        await screen.findByText("editForm.club.serverErrors.usernameTaken"),
      ).toBeInTheDocument();
    });

    it("shows IMAGE_URL_INVALID on the crest field", async () => {
      mocks.updateClub.mockRejectedValue(
        backendError({
          code: "VALIDATION_ERROR",
          fields: [{ field: "logo", code: "IMAGE_URL_INVALID" }],
        }),
      );
      const user = userEvent.setup();
      render(<ClubProfileForm />);

      await user.click(save());

      expect(
        await screen.findByText("editForm.club.serverErrors.imageInvalid"),
      ).toBeInTheDocument();
      expect(mocks.toastError).not.toHaveBeenCalled();
    });

    it("falls back to a toast for any other failure", async () => {
      mocks.updateClub.mockRejectedValue(new Error("offline"));
      const user = userEvent.setup();
      render(<ClubProfileForm />);

      await user.click(save());

      await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("editError"));
      expect(mocks.push).not.toHaveBeenCalled();
    });

    it("lets the owner fix the field and save again", async () => {
      mocks.updateClub.mockRejectedValueOnce(backendError({ code: "CLUB_NAME_TAKEN", field: "name" }));
      const user = userEvent.setup();
      render(<ClubProfileForm />);

      await user.click(save());
      await screen.findByText("editForm.club.serverErrors.clubNameTaken");
      const name = screen.getByLabelText("editForm.club.name");
      await user.clear(name);
      await user.type(name, "HC Barcelona Femenino");
      await user.click(save());

      await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/profile"));
      expect(mocks.updateClub).toHaveBeenCalledTimes(2);
    });
  });
});
