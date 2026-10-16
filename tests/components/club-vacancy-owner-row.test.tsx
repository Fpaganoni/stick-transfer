/**
 * What: Tests for ClubVacancyOwnerRow, the owner's actions on one vacancy.
 * Why: Closing, reopening, filling and deleting change what candidates can see
 *      and apply to. A vacancy can only be deleted once every application was
 *      answered, or 14 days after it was filled; the button must say why it is
 *      disabled instead of failing later, and a delete needs a confirmation.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClubVacancyOwnerRow } from "@/components/clubs/club-vacancy-owner-row";
import type { JobOpportunity } from "@/types/models/job-opportunity";

const { updateStatus, deleteVacancy } = vi.hoisted(() => ({
  updateStatus: vi.fn(),
  deleteVacancy: vi.fn(),
}));

vi.mock("@/hooks/useClubVacancies", () => ({
  useUpdateVacancyStatus: () => ({ mutate: updateStatus, isPending: false }),
  useDeleteVacancy: () => ({ mutate: deleteVacancy, isPending: false }),
}));

vi.mock("@/components/clubs/club-applicants-sheet", () => ({
  ClubApplicantsSheet: ({ open, jobTitle }: { open: boolean; jobTitle: string }) =>
    open ? <div role="dialog">applicants:{jobTitle}</div> : null,
}));

vi.mock("@/components/opportunities/opportunity-list-card", () => ({
  OpportunityListCard: (job: JobOpportunity) => <div data-testid="vacancy-card">{job.title}</div>,
}));

const DAY_MS = 24 * 60 * 60 * 1000;

function makeJob(overrides: Partial<JobOpportunity> = {}): JobOpportunity {
  return {
    id: "job-1",
    title: "Goalkeeper",
    status: "OPEN",
    filledAt: null,
    club: { id: "club-1", name: "HC Madrid" },
    ...overrides,
  } as JobOpportunity;
}

function renderRow(vacancy: JobOpportunity, unansweredCount: number | null = 0) {
  return render(
    <ClubVacancyOwnerRow clubId="club-1" vacancy={vacancy} unansweredCount={unansweredCount} />,
  );
}

describe("ClubVacancyOwnerRow", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("status", () => {
    it.each(["OPEN", "CLOSED", "FILLED"] as const)("shows the %s status", (status) => {
      renderRow(makeJob({ status }));

      expect(screen.getByText(`status.${status}`)).toBeInTheDocument();
    });

    it("reads a lower case status from older caches", () => {
      renderRow(makeJob({ status: "open" }));

      expect(screen.getByText("status.OPEN")).toBeInTheDocument();
    });
  });

  describe("close, reopen and fill", () => {
    it("closes an open vacancy", async () => {
      const user = userEvent.setup();
      renderRow(makeJob({ status: "OPEN" }));

      await user.click(screen.getByRole("button", { name: "close" }));

      expect(updateStatus).toHaveBeenCalledWith({ id: "job-1", clubId: "club-1", status: "CLOSED" });
    });

    it("marks an open vacancy as filled", async () => {
      const user = userEvent.setup();
      renderRow(makeJob({ status: "OPEN" }));

      await user.click(screen.getByRole("button", { name: "markFilled" }));

      expect(updateStatus).toHaveBeenCalledWith({ id: "job-1", clubId: "club-1", status: "FILLED" });
    });

    it("reopens a closed vacancy and can still mark it as filled", async () => {
      const user = userEvent.setup();
      renderRow(makeJob({ status: "CLOSED" }));

      expect(screen.queryByRole("button", { name: "close" })).toBeNull();
      await user.click(screen.getByRole("button", { name: "reopen" }));

      expect(updateStatus).toHaveBeenCalledWith({ id: "job-1", clubId: "club-1", status: "OPEN" });
      expect(screen.getByRole("button", { name: "markFilled" })).toBeInTheDocument();
    });

    it("reopens a filled vacancy but does not offer to fill it again", async () => {
      const user = userEvent.setup();
      renderRow(makeJob({ status: "FILLED", filledAt: new Date().toISOString() }));

      expect(screen.queryByRole("button", { name: "markFilled" })).toBeNull();
      await user.click(screen.getByRole("button", { name: "reopen" }));

      expect(updateStatus).toHaveBeenCalledWith({ id: "job-1", clubId: "club-1", status: "OPEN" });
    });
  });

  describe("delete", () => {
    it("asks for confirmation before deleting", async () => {
      const user = userEvent.setup();
      renderRow(makeJob());

      await user.click(screen.getByRole("button", { name: "delete" }));
      expect(deleteVacancy).not.toHaveBeenCalled();

      const dialog = await screen.findByRole("alertdialog");
      await user.click(within(dialog).getByRole("button", { name: "confirmDelete" }));

      expect(deleteVacancy).toHaveBeenCalledWith({ id: "job-1", clubId: "club-1" });
    });

    it("does nothing when the owner cancels", async () => {
      const user = userEvent.setup();
      renderRow(makeJob());

      await user.click(screen.getByRole("button", { name: "delete" }));
      const dialog = await screen.findByRole("alertdialog");
      await user.click(within(dialog).getByRole("button", { name: "cancel" }));

      expect(deleteVacancy).not.toHaveBeenCalled();
    });

    it("blocks the delete while applications wait for an answer and says why", () => {
      renderRow(makeJob({ status: "OPEN" }), 2);

      expect(screen.getByRole("button", { name: "delete" })).toBeDisabled();
      expect(screen.getByText("deleteBlockedUnanswered")).toBeInTheDocument();
    });

    it("blocks the delete of a recently filled vacancy and says when it unlocks", () => {
      const filledAt = new Date(Date.now() - 3 * DAY_MS).toISOString();
      renderRow(makeJob({ status: "FILLED", filledAt }), 1);

      expect(screen.getByRole("button", { name: "delete" })).toBeDisabled();
      expect(screen.getByText("deleteAvailableOn")).toBeInTheDocument();
    });

    it("keeps the delete disabled, and says so, while the unanswered applications are unknown", () => {
      renderRow(makeJob({ status: "OPEN" }), null);

      expect(screen.getByRole("button", { name: "delete" })).toBeDisabled();
      expect(screen.getByText("deleteCountsUnavailable")).toBeInTheDocument();
    });

    it("shows no applicants badge while the count is unknown", () => {
      renderRow(makeJob(), null);

      expect(screen.getByRole("button", { name: /applicants/ })).not.toHaveTextContent(/\d/);
    });

    it("allows deleting a vacancy filled 14 days ago even with applications left", () => {
      const filledAt = new Date(Date.now() - 15 * DAY_MS).toISOString();
      renderRow(makeJob({ status: "FILLED", filledAt }), 4);

      expect(screen.getByRole("button", { name: "delete" })).toBeEnabled();
      expect(screen.queryByText("deleteBlockedUnanswered")).toBeNull();
    });
  });

  describe("applicants", () => {
    it("shows how many applications wait for an answer", () => {
      renderRow(makeJob(), 3);

      expect(screen.getByRole("button", { name: /applicants/ })).toHaveTextContent("3");
    });

    it("opens the applicants panel of this vacancy", async () => {
      const user = userEvent.setup();
      renderRow(makeJob());

      await user.click(screen.getByRole("button", { name: /applicants/ }));

      expect(screen.getByText("applicants:Goalkeeper")).toBeInTheDocument();
    });
  });
});
