/**
 * What: Component tests for UmpireProfileForm.
 * Why: This is where an umpire loads the data that makes them discoverable
 *      (licence, modalities, categories). The form must prefill from the
 *      stored profile, validate before calling the API, never send licence
 *      fields that did not change (the backend un-verifies on any licence arg)
 *      and warn a verified umpire before a licence edit costs them the badge.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UmpireProfileForm } from "@/components/profile/edit/umpire-profile-form";
import { Role, UmpireLicenseLevel, UmpireModality, UmpireCategory, TravelAvailability } from "@/types/enums";

const { mockPush, mockUpdateProfile, mockStoreUpdate, mockToast, state } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockUpdateProfile: vi.fn(),
  mockStoreUpdate: vi.fn(),
  mockToast: { success: vi.fn(), error: vi.fn() },
  state: { user: null as Record<string, unknown> | null },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("sonner", () => ({ toast: mockToast }));

vi.mock("@/stores/useAuthStore", () => ({
  useAuthStore: () => ({ user: state.user, updateUser: mockStoreUpdate }),
}));

vi.mock("@/hooks/useUsers", () => ({
  useUpdateUser: () => ({ mutateAsync: mockUpdateProfile }),
  useUploadCv: () => ({ mutateAsync: vi.fn() }),
  useDeleteCv: () => ({ mutateAsync: vi.fn() }),
}));

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "ump-1",
    name: "Javier García",
    username: "umpire_garcia",
    email: "g@test.com",
    role: Role.UMPIRE,
    isVerified: false,
    avatar: "",
    coverImage: "",
    bio: "Fair play first",
    country: "Spain",
    city: "Madrid",
    yearsOfExperience: 14,
    certificationYear: 2012,
    matchesOfficiated: 640,
    licenseLevel: UmpireLicenseLevel.INTERNACIONAL,
    certifyingBody: "Real Federación Española de Hockey",
    licenseNumber: "RFEH-001",
    travelAvailability: TravelAvailability.INTERNACIONAL,
    languages: ["Español", "English"],
    modalities: [UmpireModality.CESPED],
    umpireCategories: [UmpireCategory.MAYORES],
    umpireCertifications: [
      {
        id: "c1",
        name: "Licencia internacional",
        issuer: "RFEH",
        issuedAt: "2012-05-31T22:00:00.000Z",
        fileUrl: null,
        order: 0,
      },
    ],
    trajectories: [],
    multimedia: [],
    ...overrides,
  };
}

const saveButton = () => screen.getByRole("button", { name: "editForm.saveChanges" });

describe("UmpireProfileForm", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockUpdateProfile.mockReset();
    mockStoreUpdate.mockReset();
    mockToast.success.mockReset();
    mockToast.error.mockReset();
    mockUpdateProfile.mockResolvedValue({ updateUser: { id: "ump-1", isVerified: false } });
    state.user = makeUser();
  });

  describe("rendering", () => {
    it("renders the umpire sections and none of the player/club-only fields", () => {
      render(<UmpireProfileForm />);

      expect(screen.getByText("editForm.umpire.title")).toBeInTheDocument();
      expect(screen.getByText("editForm.umpire.certifications.title")).toBeInTheDocument();
      expect(screen.getByLabelText("editForm.umpire.licenseLevel")).toBeInTheDocument();
      expect(screen.queryByText("editForm.position")).not.toBeInTheDocument();
      expect(screen.queryByText("editForm.club.name")).not.toBeInTheDocument();
    });

    it("prefills every umpire field from the stored profile", () => {
      render(<UmpireProfileForm />);

      expect(screen.getByLabelText("editForm.umpire.licenseLevel")).toHaveValue("INTERNACIONAL");
      expect(screen.getByLabelText("editForm.umpire.certifyingBody")).toHaveValue(
        "Real Federación Española de Hockey",
      );
      expect(screen.getByLabelText("editForm.umpire.licenseNumber")).toHaveValue("RFEH-001");
      expect(screen.getByLabelText("editForm.umpire.certificationYear")).toHaveValue(2012);
      expect(screen.getByLabelText("editForm.umpire.matchesOfficiated")).toHaveValue(640);
      expect(screen.getByLabelText("editForm.yearsOfExperience")).toHaveValue(14);
      expect(screen.getByLabelText("editForm.umpire.travelAvailability")).toHaveValue("INTERNACIONAL");
      expect(screen.getByLabelText("editForm.umpire.languages")).toHaveValue("Español, English");
      expect(screen.getByLabelText("modalities.CESPED")).toBeChecked();
      expect(screen.getByLabelText("modalities.SALA")).not.toBeChecked();
      expect(screen.getByLabelText("categories.MAYORES")).toBeChecked();
      expect(screen.getByDisplayValue("Licencia internacional")).toBeInTheDocument();
      expect(screen.getByDisplayValue("2012-05-31")).toBeInTheDocument();
    });

    it("renders empty (not 'null') for an umpire who has not filled licence data yet", () => {
      state.user = makeUser({
        yearsOfExperience: null,
        certificationYear: null,
        matchesOfficiated: null,
        licenseLevel: null,
        certifyingBody: null,
        licenseNumber: null,
        travelAvailability: null,
        languages: [],
        modalities: [],
        umpireCategories: [],
        umpireCertifications: [],
      });
      render(<UmpireProfileForm />);

      expect(screen.getByLabelText("editForm.umpire.licenseLevel")).toHaveValue("");
      expect(screen.getByLabelText("editForm.umpire.certifyingBody")).toHaveValue("");
      expect(screen.getByLabelText("editForm.umpire.matchesOfficiated")).toHaveValue(null);
      expect(screen.getByLabelText("modalities.CESPED")).not.toBeChecked();
    });
  });

  describe("validation", () => {
    it("blocks saving when the certification year is out of range", async () => {
      const user = userEvent.setup();
      render(<UmpireProfileForm />);

      const year = screen.getByLabelText("editForm.umpire.certificationYear");
      await user.clear(year);
      await user.type(year, "1900");
      await user.click(saveButton());

      expect(await screen.findByText("editForm.umpire.validation.yearRange")).toBeInTheDocument();
      expect(mockUpdateProfile).not.toHaveBeenCalled();
    });

    it("requires name and issuer for a newly added certification", async () => {
      const user = userEvent.setup();
      render(<UmpireProfileForm />);

      await user.click(screen.getByRole("button", { name: /editForm.umpire.certifications.add/ }));
      await user.click(saveButton());

      expect(await screen.findByText("editForm.umpire.validation.certNameRequired")).toBeInTheDocument();
      expect(screen.getByText("editForm.umpire.validation.issuerRequired")).toBeInTheDocument();
      expect(mockUpdateProfile).not.toHaveBeenCalled();
    });
  });

  describe("saving", () => {
    it("sends unchanged licence fields as absent, and the replace-whole lists in full", async () => {
      const user = userEvent.setup();
      render(<UmpireProfileForm />);

      await user.click(screen.getByLabelText("modalities.SALA"));
      await user.click(screen.getByLabelText("categories.FEMENINO"));
      const matches = screen.getByLabelText("editForm.umpire.matchesOfficiated");
      await user.clear(matches);
      await user.type(matches, "650");
      await user.click(saveButton());

      await waitFor(() => expect(mockUpdateProfile).toHaveBeenCalledTimes(1));
      const payload = mockUpdateProfile.mock.calls[0][0];

      expect(payload).toMatchObject({
        id: "ump-1",
        matchesOfficiated: 650,
        yearsOfExperience: 14,
        certificationYear: 2012,
        travelAvailability: "INTERNACIONAL",
        languages: ["Español", "English"],
        modalities: ["CESPED", "SALA"],
        umpireCategories: ["MAYORES", "FEMENINO"],
        umpireCertifications: [
          {
            name: "Licencia internacional",
            issuer: "RFEH",
            issuedAt: "2012-05-31",
            order: 0,
          },
        ],
      });
      expect(payload).not.toHaveProperty("licenseLevel");
      expect(payload).not.toHaveProperty("certifyingBody");
      expect(payload).not.toHaveProperty("licenseNumber");
      expect(payload).not.toHaveProperty("position");
    });

    it("saves a new certification added in the form", async () => {
      const user = userEvent.setup();
      render(<UmpireProfileForm />);

      await user.click(screen.getByRole("button", { name: /editForm.umpire.certifications.add/ }));
      const names = screen.getAllByLabelText("editForm.umpire.certifications.name");
      const issuers = screen.getAllByLabelText("editForm.umpire.certifications.issuer");
      await user.type(names[1], "Curso de reglas");
      await user.type(issuers[1], "FIH");
      await user.click(saveButton());

      await waitFor(() => expect(mockUpdateProfile).toHaveBeenCalledTimes(1));
      const certs = mockUpdateProfile.mock.calls[0][0].umpireCertifications;
      expect(certs).toHaveLength(2);
      expect(certs[1]).toMatchObject({ name: "Curso de reglas", issuer: "FIH", order: 1 });
    });

    it("removes a certification from the saved list", async () => {
      const user = userEvent.setup();
      render(<UmpireProfileForm />);

      await user.click(screen.getByRole("button", { name: /editForm.umpire.certifications.remove/ }));
      await user.click(saveButton());

      await waitFor(() => expect(mockUpdateProfile).toHaveBeenCalledTimes(1));
      expect(mockUpdateProfile.mock.calls[0][0].umpireCertifications).toEqual([]);
    });

    it("updates the store, confirms and returns to the profile after saving", async () => {
      const user = userEvent.setup();
      render(<UmpireProfileForm />);

      await user.click(screen.getByLabelText("modalities.INDOOR"));
      await user.click(saveButton());

      await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/profile"));
      expect(mockToast.success).toHaveBeenCalled();
      expect(mockStoreUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ modalities: ["CESPED", "INDOOR"], languages: ["Español", "English"] }),
      );
    });

    it("shows an error toast and stays on the page when the API fails", async () => {
      mockUpdateProfile.mockRejectedValueOnce(new Error("boom"));
      vi.spyOn(console, "error").mockImplementation(() => {});
      const user = userEvent.setup();
      render(<UmpireProfileForm />);

      await user.click(saveButton());

      await waitFor(() => expect(mockToast.error).toHaveBeenCalled());
      expect(mockPush).not.toHaveBeenCalled();
      expect(mockStoreUpdate).not.toHaveBeenCalled();
    });
  });

  describe("verification warning", () => {
    it("does not warn an unverified umpire who edits licence data", async () => {
      const user = userEvent.setup();
      render(<UmpireProfileForm />);

      await user.selectOptions(screen.getByLabelText("editForm.umpire.licenseLevel"), "NACIONAL");
      await user.click(saveButton());

      await waitFor(() => expect(mockUpdateProfile).toHaveBeenCalledTimes(1));
      expect(mockUpdateProfile.mock.calls[0][0].licenseLevel).toBe("NACIONAL");
      expect(screen.queryByText("editForm.umpire.verificationWarning.title")).not.toBeInTheDocument();
    });

    it("does not warn a verified umpire when licence data is untouched", async () => {
      state.user = makeUser({ isVerified: true });
      const user = userEvent.setup();
      render(<UmpireProfileForm />);

      await user.click(screen.getByLabelText("modalities.SALA"));
      await user.click(saveButton());

      await waitFor(() => expect(mockUpdateProfile).toHaveBeenCalledTimes(1));
      expect(screen.queryByText("editForm.umpire.verificationWarning.title")).not.toBeInTheDocument();
    });

    it("asks a verified umpire to confirm before a licence change is saved", async () => {
      state.user = makeUser({ isVerified: true });
      const user = userEvent.setup();
      render(<UmpireProfileForm />);

      await user.selectOptions(screen.getByLabelText("editForm.umpire.licenseLevel"), "NACIONAL");
      await user.click(saveButton());

      const dialog = await screen.findByRole("alertdialog");
      expect(within(dialog).getByText("editForm.umpire.verificationWarning.title")).toBeInTheDocument();
      expect(mockUpdateProfile).not.toHaveBeenCalled();

      await user.click(within(dialog).getByText("editForm.umpire.verificationWarning.confirm"));

      await waitFor(() => expect(mockUpdateProfile).toHaveBeenCalledTimes(1));
      expect(mockUpdateProfile.mock.calls[0][0].licenseLevel).toBe("NACIONAL");
    });

    it("saves nothing when the verified umpire backs out of the warning", async () => {
      state.user = makeUser({ isVerified: true });
      const user = userEvent.setup();
      render(<UmpireProfileForm />);

      const body = screen.getByLabelText("editForm.umpire.certifyingBody");
      await user.clear(body);
      await user.type(body, "FIH");
      await user.click(saveButton());

      const dialog = await screen.findByRole("alertdialog");
      await user.click(within(dialog).getByText("editForm.umpire.verificationWarning.cancel"));

      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      expect(mockUpdateProfile).not.toHaveBeenCalled();
    });

    it("mirrors the backend's un-verification in the store", async () => {
      state.user = makeUser({ isVerified: true });
      mockUpdateProfile.mockResolvedValue({ updateUser: { id: "ump-1", isVerified: false } });
      const user = userEvent.setup();
      render(<UmpireProfileForm />);

      await user.selectOptions(screen.getByLabelText("editForm.umpire.licenseLevel"), "REGIONAL");
      await user.click(saveButton());
      const dialog = await screen.findByRole("alertdialog");
      await user.click(within(dialog).getByText("editForm.umpire.verificationWarning.confirm"));

      await waitFor(() =>
        expect(mockStoreUpdate).toHaveBeenCalledWith(expect.objectContaining({ isVerified: false })),
      );
    });
  });
});
