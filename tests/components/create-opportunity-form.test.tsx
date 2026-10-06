/**
 * What: Tests for CreateOpportunityForm with the UMPIRE position type.
 * Why: The backend only accepts PLAYER/COACH/STAFF/UMPIRE/OTHER and answers
 *      400 if licence/modality/category/matchDate are sent for any other type.
 *      A club posting an umpire match must be able to set those, and a club
 *      posting anything else must never send them.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateOpportunityForm } from "@/components/opportunities/create-opportunity-form";

const { mockCreate, mockPush, mockToast } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockPush: vi.fn(),
  mockToast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("sonner", () => ({ toast: mockToast }));

vi.mock("@/hooks/useJobOpportunities", () => ({
  useCreateJobOpportunity: () => ({ mutateAsync: mockCreate }),
}));

async function choose(user: ReturnType<typeof userEvent.setup>, trigger: HTMLElement, option: string) {
  await user.click(trigger);
  await user.click(await screen.findByRole("option", { name: option }));
}

const positionTrigger = () => screen.getAllByRole("combobox")[0];

async function fillBasics(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("create.titleLabel"), "Umpire - Division de Honor");
  await user.type(screen.getByLabelText("create.descriptionLabel"), "Primera division");
  await user.type(screen.getByLabelText("create.countryLabel"), "Spain");
  await user.type(screen.getByLabelText("create.cityLabel"), "Madrid");
}

const submit = () => screen.getByRole("button", { name: "create.submit" });

describe("CreateOpportunityForm", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockCreate.mockResolvedValue({ createJobOpportunity: { id: "job-1" } });
    mockPush.mockReset();
    mockToast.success.mockReset();
    mockToast.error.mockReset();
  });

  describe("position type", () => {
    it("offers only the types the backend accepts", async () => {
      const user = userEvent.setup();
      render(<CreateOpportunityForm />);

      await user.click(positionTrigger());

      for (const type of ["PLAYER", "COACH", "STAFF", "UMPIRE", "OTHER"]) {
        expect(await screen.findByRole("option", { name: `positionTypes.${type}` })).toBeInTheDocument();
      }
      expect(screen.queryByRole("option", { name: "Goalkeeper" })).not.toBeInTheDocument();
      expect(screen.queryByRole("option", { name: "Umpire" })).not.toBeInTheDocument();
    });

    it("requires a position type", async () => {
      const user = userEvent.setup();
      render(<CreateOpportunityForm />);

      await fillBasics(user);
      await user.click(submit());

      expect(await screen.findByText("create.validation.positionTypeRequired")).toBeInTheDocument();
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe("umpire fields", () => {
    it("are hidden until UMPIRE is selected", async () => {
      const user = userEvent.setup();
      render(<CreateOpportunityForm />);

      expect(screen.queryByLabelText("umpireJob.licenseLevel")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("umpireJob.matchDate")).not.toBeInTheDocument();

      await choose(user, positionTrigger(), "positionTypes.UMPIRE");

      expect(screen.getByLabelText("umpireJob.licenseLevel")).toBeInTheDocument();
      expect(screen.getByLabelText("umpireJob.modality")).toBeInTheDocument();
      expect(screen.getByLabelText("umpireJob.category")).toBeInTheDocument();
      expect(screen.getByLabelText("umpireJob.matchDate")).toBeInTheDocument();
    });

    it("stay hidden for other position types", async () => {
      const user = userEvent.setup();
      render(<CreateOpportunityForm />);

      await choose(user, positionTrigger(), "positionTypes.COACH");

      expect(screen.queryByLabelText("umpireJob.licenseLevel")).not.toBeInTheDocument();
    });

    it("disappear again if the club switches away from UMPIRE", async () => {
      const user = userEvent.setup();
      render(<CreateOpportunityForm />);

      await choose(user, positionTrigger(), "positionTypes.UMPIRE");
      await choose(user, positionTrigger(), "positionTypes.PLAYER");

      expect(screen.queryByLabelText("umpireJob.licenseLevel")).not.toBeInTheDocument();
    });
  });

  describe("submitting", () => {
    it("sends a non-umpire job without any umpire field", async () => {
      const user = userEvent.setup();
      render(<CreateOpportunityForm />);

      await fillBasics(user);
      await choose(user, positionTrigger(), "positionTypes.COACH");
      await user.click(submit());

      await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));
      const payload = mockCreate.mock.calls[0][0];
      expect(payload.positionType).toBe("COACH");
      for (const key of ["licenseLevelRequired", "modality", "umpireCategory", "matchDate"]) {
        expect(payload).not.toHaveProperty(key);
      }
    });

    it("sends the umpire requirements as backend enum values and an ISO match date", async () => {
      const user = userEvent.setup();
      render(<CreateOpportunityForm />);

      await fillBasics(user);
      await choose(user, positionTrigger(), "positionTypes.UMPIRE");
      await choose(user, screen.getByLabelText("umpireJob.licenseLevel"), "licenseLevels.NACIONAL");
      await choose(user, screen.getByLabelText("umpireJob.modality"), "modalities.CESPED");
      await choose(user, screen.getByLabelText("umpireJob.category"), "categories.MASCULINO");
      fireEvent.change(screen.getByLabelText("umpireJob.matchDate"), {
        target: { value: "2026-11-15T10:00" },
      });
      await user.click(submit());

      await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));
      expect(mockCreate.mock.calls[0][0]).toMatchObject({
        positionType: "UMPIRE",
        licenseLevelRequired: "NACIONAL",
        modality: "CESPED",
        umpireCategory: "MASCULINO",
        matchDate: new Date("2026-11-15T10:00").toISOString(),
      });
    });

    it("omits umpire fields the club left blank instead of sending empty strings", async () => {
      const user = userEvent.setup();
      render(<CreateOpportunityForm />);

      await fillBasics(user);
      await choose(user, positionTrigger(), "positionTypes.UMPIRE");
      await user.click(submit());

      await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));
      const payload = mockCreate.mock.calls[0][0];
      expect(payload.positionType).toBe("UMPIRE");
      for (const key of ["licenseLevelRequired", "modality", "umpireCategory", "matchDate"]) {
        expect(payload).not.toHaveProperty(key);
      }
    });

    it("drops umpire values already chosen when the club changes the type before publishing", async () => {
      const user = userEvent.setup();
      render(<CreateOpportunityForm />);

      await fillBasics(user);
      await choose(user, positionTrigger(), "positionTypes.UMPIRE");
      await choose(user, screen.getByLabelText("umpireJob.modality"), "modalities.SALA");
      await choose(user, positionTrigger(), "positionTypes.STAFF");
      await user.click(submit());

      await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));
      const payload = mockCreate.mock.calls[0][0];
      expect(payload.positionType).toBe("STAFF");
      expect(payload).not.toHaveProperty("modality");
    });

    it("requires country and city, which the backend marks as non-null", async () => {
      const user = userEvent.setup();
      render(<CreateOpportunityForm />);

      await user.type(screen.getByLabelText("create.titleLabel"), "Umpire");
      await user.type(screen.getByLabelText("create.descriptionLabel"), "Match");
      await choose(user, positionTrigger(), "positionTypes.UMPIRE");
      await user.click(submit());

      expect(await screen.findByText("create.validation.countryRequired")).toBeInTheDocument();
      expect(screen.getByText("create.validation.cityRequired")).toBeInTheDocument();
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("sends benefits as one comma separated string", async () => {
      const user = userEvent.setup();
      render(<CreateOpportunityForm />);

      await fillBasics(user);
      await choose(user, positionTrigger(), "positionTypes.COACH");
      await user.type(screen.getByLabelText("create.benefitsLabel"), "housing,  car ");
      await user.click(submit());

      await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));
      expect(mockCreate.mock.calls[0][0].benefits).toBe("housing, car");
    });

    it("goes back to the list after publishing", async () => {
      const user = userEvent.setup();
      render(<CreateOpportunityForm />);

      await fillBasics(user);
      await choose(user, positionTrigger(), "positionTypes.UMPIRE");
      await user.click(submit());

      await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/opportunities"));
      expect(mockToast.success).toHaveBeenCalled();
    });

    it("shows an error toast and stays when the backend rejects the job", async () => {
      mockCreate.mockRejectedValueOnce(new Error("Invalid positionType"));
      vi.spyOn(console, "error").mockImplementation(() => {});
      const user = userEvent.setup();
      render(<CreateOpportunityForm />);

      await fillBasics(user);
      await choose(user, positionTrigger(), "positionTypes.UMPIRE");
      await user.click(submit());

      await waitFor(() => expect(mockToast.error).toHaveBeenCalled());
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
