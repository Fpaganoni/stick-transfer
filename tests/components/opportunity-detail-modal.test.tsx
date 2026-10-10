/**
 * What: Tests for who sees the "Apply" action in OpportunityDetailModal and
 *       how umpire opportunities are presented.
 * Why: The backend answers 403 when anyone but an umpire (or admin) applies to
 *      an UMPIRE opportunity. The UI must not offer a button that is bound to
 *      fail, while keeping the existing rules for every other opportunity.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { OpportunityDetailModal } from "@/components/opportunities/opportunity-detail-modal";
import { useOpportunitiesStore } from "@/stores/useOpportunitiesStore";
import type { JobOpportunity } from "@/types/models/job-opportunity";

const { roleState, authState } = vi.hoisted(() => ({
  roleState: { isClub: false, isSuperAdmin: false, isUmpire: false },
  authState: { user: { id: "viewer-1", cvUrl: null } as { id: string; cvUrl: null } | null },
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("@/hooks/useRole", () => ({ useRole: () => roleState }));

vi.mock("@/stores/useAuthStore", () => ({
  useAuthStore: () => ({ user: authState.user }),
}));

// Stands in for the ["userApplications", userId] cache: applying adds the id,
// exactly as useApplyForJob's onSuccess does with setQueryData.
const { appliedIds } = vi.hoisted(() => ({ appliedIds: new Set<string>() }));

vi.mock("@/hooks/useJobApplications", () => ({
  useApplyForJob: () => ({
    mutate: (
      variables: { jobOpportunityId: string },
      options?: { onSuccess?: () => void },
    ) => {
      appliedIds.add(variables.jobOpportunityId);
      options?.onSuccess?.();
    },
    isPending: false,
  }),
  useUserApplications: () => ({
    hasAppliedTo: (id: string) => appliedIds.has(id),
    isLoading: false,
  }),
}));

const { toggleSaveMock, openLoginModalMock } = vi.hoisted(() => ({
  toggleSaveMock: vi.fn(),
  openLoginModalMock: vi.fn(),
}));

vi.mock("@/hooks/useSavedJobs", () => ({
  useToggleSaveJob: () => ({ mutate: toggleSaveMock }),
}));

vi.mock("@/stores/useUIStore", () => ({
  useUIStore: () => ({ openLoginModal: openLoginModalMock }),
}));

vi.mock("@/lib/date-utils", () => ({
  formatRelativeTime: () => "2 days ago",
}));

const base: JobOpportunity = {
  id: "job-1",
  title: "Some job",
  description: "Description",
  positionType: "PLAYER",
  level: "PROFESSIONAL",
  country: "Spain",
  city: "Madrid",
  salary: 0,
  currency: "EUR",
  benefits: [],
  status: "open",
  createdAt: "2026-05-01T00:00:00Z",
  club: { id: "c1", name: "HC Madrid", isVerified: true } as JobOpportunity["club"],
};

const umpireJob: JobOpportunity = {
  ...base,
  title: "Umpire - Division de Honor",
  positionType: "UMPIRE",
  licenseLevelRequired: "NACIONAL" as never,
  modality: "OUTDOOR" as never,
  umpireCategory: "MASCULINO" as never,
  matchDate: "2026-11-15T10:00:00Z",
};

function open(job: JobOpportunity) {
  act(() => {
    useOpportunitiesStore.setState({ selectedOpportunity: job, isModalOpen: true });
  });
  return render(<OpportunityDetailModal />);
}

const applyButton = () => screen.queryByRole("button", { name: "applyWithProfile" });

describe("OpportunityDetailModal", () => {
  beforeEach(() => {
    roleState.isClub = false;
    roleState.isSuperAdmin = false;
    roleState.isUmpire = false;
    authState.user = { id: "viewer-1", cvUrl: null };
    useOpportunitiesStore.setState({ selectedOpportunity: null, isModalOpen: false });
    toggleSaveMock.mockReset();
    openLoginModalMock.mockReset();
    appliedIds.clear();
  });

  describe("application sent state", () => {
    const sent = () => screen.queryByRole("button", { name: "applicationSent" });

    it("does not carry the applied state over to the next opportunity", () => {
      const jobA = { ...base, id: "job-a", title: "Job A" };
      const jobB = { ...base, id: "job-b", title: "Job B" };
      const { rerender } = open(jobA);

      fireEvent.click(applyButton()!);
      rerender(<OpportunityDetailModal />);
      expect(sent()).toBeInTheDocument();

      // The modal stays mounted while the store swaps the opportunity
      act(() => useOpportunitiesStore.getState().closeModal());
      act(() => {
        useOpportunitiesStore.setState({ selectedOpportunity: jobB, isModalOpen: true });
      });

      expect(screen.getByText("Job B")).toBeInTheDocument();
      expect(applyButton()).toBeInTheDocument();
      expect(sent()).not.toBeInTheDocument();
    });

    it("shows the application as sent when the backend says so", () => {
      open({ ...base, hasAppliedByCurrentUser: true });

      expect(sent()).toBeInTheDocument();
      expect(applyButton()).not.toBeInTheDocument();
    });

    it("shows the application as sent when it is in the user's applications", () => {
      appliedIds.add("job-1");
      open(base);

      expect(sent()).toBeInTheDocument();
    });
  });

  describe("saving the opportunity", () => {
    const bookmark = () => screen.getByRole("button", { name: "Bookmark" });

    it("saves it on the server for a logged-in user", () => {
      open(base);

      fireEvent.click(bookmark());

      expect(toggleSaveMock).toHaveBeenCalledWith({
        job: expect.objectContaining({ id: "job-1" }),
        save: true,
      });
      expect(openLoginModalMock).not.toHaveBeenCalled();
    });

    it("reflects isSavedByCurrentUser and unsaves on click", () => {
      open({ ...base, isSavedByCurrentUser: true });

      expect(bookmark()).toHaveAttribute("aria-pressed", "true");
      fireEvent.click(bookmark());

      expect(toggleSaveMock).toHaveBeenCalledWith({
        job: expect.objectContaining({ id: "job-1" }),
        save: false,
      });
    });

    it("asks visitors to sign in instead of saving", () => {
      authState.user = null;
      open(base);

      fireEvent.click(bookmark());

      expect(openLoginModalMock).toHaveBeenCalled();
      expect(toggleSaveMock).not.toHaveBeenCalled();
    });
  });

  describe("applying to an UMPIRE opportunity", () => {
    it("is offered to umpires", () => {
      roleState.isUmpire = true;
      open(umpireJob);

      expect(applyButton()).toBeInTheDocument();
      expect(screen.queryByText("umpireJob.onlyUmpires")).not.toBeInTheDocument();
    });

    it("is not offered to players or coaches, who are told why", () => {
      open(umpireJob);

      expect(applyButton()).not.toBeInTheDocument();
      expect(screen.getByText("umpireJob.onlyUmpires")).toBeInTheDocument();
    });

    it("is not offered to clubs, and they get no explanation meant for applicants", () => {
      roleState.isClub = true;
      open(umpireJob);

      expect(applyButton()).not.toBeInTheDocument();
      expect(screen.queryByText("umpireJob.onlyUmpires")).not.toBeInTheDocument();
    });

    it("is not offered to admins", () => {
      roleState.isSuperAdmin = true;
      open(umpireJob);

      expect(applyButton()).not.toBeInTheDocument();
    });

    it("is shown disabled to visitors so they are prompted to sign in", () => {
      authState.user = null;
      open(umpireJob);

      expect(applyButton()).toBeDisabled();
      expect(screen.queryByText("umpireJob.onlyUmpires")).not.toBeInTheDocument();
    });

    it("is matched case-insensitively on positionType", () => {
      open({ ...umpireJob, positionType: "umpire" });

      expect(applyButton()).not.toBeInTheDocument();
    });
  });

  describe("applying to other opportunities (unchanged)", () => {
    it("is offered to players", () => {
      open(base);

      expect(applyButton()).toBeInTheDocument();
      expect(screen.queryByText("umpireJob.onlyUmpires")).not.toBeInTheDocument();
    });

    it("is still offered to umpires (the backend does not restrict it)", () => {
      roleState.isUmpire = true;
      open(base);

      expect(applyButton()).toBeInTheDocument();
    });

    it("is not offered to clubs", () => {
      roleState.isClub = true;
      open(base);

      expect(applyButton()).not.toBeInTheDocument();
    });

    it("is not offered to admins", () => {
      roleState.isSuperAdmin = true;
      open(base);

      expect(applyButton()).not.toBeInTheDocument();
    });
  });

  describe("presentation", () => {
    it("shows the umpire requirements", () => {
      roleState.isUmpire = true;
      open(umpireJob);

      expect(screen.getByText("licenseLevels.NACIONAL")).toBeInTheDocument();
      expect(screen.getByText("modalities.OUTDOOR")).toBeInTheDocument();
      expect(screen.getByText("categories.MASCULINO")).toBeInTheDocument();
      expect(screen.getByText(/2026/)).toBeInTheDocument();
    });

    it("shows only the requirements that were set", () => {
      open({ ...umpireJob, modality: null, umpireCategory: null, matchDate: null });

      expect(screen.getByText("licenseLevels.NACIONAL")).toBeInTheDocument();
      expect(screen.queryByText("umpireJob.modality")).not.toBeInTheDocument();
      expect(screen.queryByText("umpireJob.category")).not.toBeInTheDocument();
      expect(screen.queryByText("umpireJob.matchDate")).not.toBeInTheDocument();
    });

    it("shows no umpire section on other opportunities", () => {
      open(base);

      expect(screen.queryByText("umpireJob.title")).not.toBeInTheDocument();
    });

    it("shows no umpire section for an umpire job without any requirement", () => {
      open({
        ...umpireJob,
        licenseLevelRequired: null,
        modality: null,
        umpireCategory: null,
        matchDate: null,
      });

      expect(screen.queryByText("umpireJob.title")).not.toBeInTheDocument();
    });

    it("shows the position type as a translated label", () => {
      open(umpireJob);

      expect(screen.getByText("positionTypes.UMPIRE")).toBeInTheDocument();
    });

    it("leaves legacy free-text position types as they are", () => {
      open({ ...base, positionType: "Full-Time" });

      expect(screen.getByText("Full-Time")).toBeInTheDocument();
    });
  });
});
