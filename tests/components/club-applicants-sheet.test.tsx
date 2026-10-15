/**
 * What: Tests for ClubApplicantsSheet, where the owner answers a vacancy's applications.
 * Why: Accepting or rejecting is final for the candidate, so the right application
 *      must be sent with the right status; withdrawn applications cannot be
 *      reviewed; and the CV link comes from user input, so only http(s) may link.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClubApplicantsSheet } from "@/components/clubs/club-applicants-sheet";
import type { JobApplication } from "@/types/models/job-application";

const { state, reviewApplication, useJobApplicantsCall } = vi.hoisted(() => ({
  state: {
    applicants: [] as JobApplication[],
    isLoading: false,
    isError: false,
  },
  reviewApplication: vi.fn(),
  useJobApplicantsCall: vi.fn(),
}));

vi.mock("@/hooks/useClubVacancies", () => ({
  useJobApplicants: (jobId: string | null) => {
    useJobApplicantsCall(jobId);
    return { data: state.applicants, isLoading: state.isLoading, isError: state.isError };
  },
  useUpdateApplicationStatus: () => ({ mutate: reviewApplication, isPending: false }),
}));

function makeApplication(overrides: Partial<JobApplication> = {}): JobApplication {
  return {
    id: "app-1",
    jobOpportunityId: "job-1",
    userId: "u1",
    status: "PENDING",
    appliedAt: "2026-10-02T00:00:00.000Z",
    updatedAt: "2026-10-02T00:00:00.000Z",
    user: { id: "u1", name: "Lucia Jimenez", username: "lucia_jimenez" },
    ...overrides,
  } as JobApplication;
}

function renderSheet(open = true) {
  return render(
    <ClubApplicantsSheet
      open={open}
      onOpenChange={vi.fn()}
      clubId="club-1"
      jobId="job-1"
      jobTitle="Goalkeeper"
    />,
  );
}

describe("ClubApplicantsSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.applicants = [];
    state.isLoading = false;
    state.isError = false;
  });

  it("does not load the applicants until the panel is opened", () => {
    renderSheet(false);

    expect(useJobApplicantsCall).toHaveBeenLastCalledWith(null);
  });

  it("loads the applicants of its vacancy when opened", () => {
    renderSheet();

    expect(useJobApplicantsCall).toHaveBeenLastCalledWith("job-1");
    expect(screen.getByText("applicantsTitle")).toBeInTheDocument();
  });

  it("says when nobody applied", () => {
    renderSheet();

    expect(screen.getByText("applicantsEmpty")).toBeInTheDocument();
  });

  it("says when the applicants could not be loaded", () => {
    state.isError = true;
    renderSheet();

    expect(screen.getByRole("alert")).toHaveTextContent("applicantsLoadError");
  });

  it("lists every applicant with their status and a link to their profile", () => {
    state.applicants = [
      makeApplication(),
      makeApplication({
        id: "app-2",
        userId: "u2",
        status: "ACCEPTED",
        user: { id: "u2", name: "Ana Perez", username: "ana_perez" },
      } as Partial<JobApplication>),
    ];
    renderSheet();

    expect(screen.getByRole("link", { name: "Lucia Jimenez" })).toHaveAttribute(
      "href",
      "/profile/lucia_jimenez",
    );
    expect(screen.getByText("applicationStatus.PENDING")).toBeInTheDocument();
    expect(screen.getByText("applicationStatus.ACCEPTED")).toBeInTheDocument();
  });

  it("shows the cover letter as plain text", () => {
    state.applicants = [makeApplication({ coverLetter: "<b>Hello</b> I am a keeper" })];
    renderSheet();

    expect(screen.getByText("<b>Hello</b> I am a keeper")).toBeInTheDocument();
  });

  describe("reviewing", () => {
    it.each([
      ["accept", "ACCEPTED"],
      ["reject", "REJECTED"],
      ["markUnderReview", "UNDER_REVIEW"],
    ])("sends %s as %s for that application", async (action, status) => {
      state.applicants = [makeApplication()];
      const user = userEvent.setup();
      renderSheet();

      await user.click(screen.getByRole("button", { name: action }));

      expect(reviewApplication).toHaveBeenCalledWith({
        applicationId: "app-1",
        jobOpportunityId: "job-1",
        clubId: "club-1",
        status,
      });
    });

    it("answers the application that was clicked, not another one", async () => {
      state.applicants = [
        makeApplication(),
        makeApplication({ id: "app-2", userId: "u2", user: { id: "u2", name: "Ana Perez" } } as Partial<JobApplication>),
      ];
      const user = userEvent.setup();
      renderSheet();

      const second = screen.getByRole("listitem", { name: /Ana Perez/ });
      await user.click(within(second).getByRole("button", { name: "reject" }));

      expect(reviewApplication).toHaveBeenCalledWith(
        expect.objectContaining({ applicationId: "app-2", status: "REJECTED" }),
      );
    });

    it("marks the current decision instead of offering it again", () => {
      state.applicants = [makeApplication({ status: "ACCEPTED" })];
      renderSheet();

      expect(screen.getByRole("button", { name: "accept" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "reject" })).toBeEnabled();
    });

    it("lets the owner reverse a decision", async () => {
      state.applicants = [makeApplication({ status: "REJECTED" })];
      const user = userEvent.setup();
      renderSheet();

      await user.click(screen.getByRole("button", { name: "accept" }));

      expect(reviewApplication).toHaveBeenCalledWith(
        expect.objectContaining({ status: "ACCEPTED" }),
      );
    });

    it("offers no actions for a withdrawn application", () => {
      state.applicants = [makeApplication({ status: "WITHDRAWN" })];
      renderSheet();

      expect(screen.getByText("applicationStatus.WITHDRAWN")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "accept" })).toBeNull();
      expect(screen.queryByRole("button", { name: "reject" })).toBeNull();
      expect(screen.queryByRole("button", { name: "markUnderReview" })).toBeNull();
    });
  });

  describe("CV link", () => {
    it("links an https CV in a new tab", () => {
      state.applicants = [makeApplication({ resumeUrl: "https://res.cloudinary.com/demo/cv.pdf" })];
      renderSheet();

      const link = screen.getByRole("link", { name: "resume" });
      expect(link).toHaveAttribute("href", "https://res.cloudinary.com/demo/cv.pdf");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("never links a javascript: CV", () => {
      state.applicants = [makeApplication({ resumeUrl: "javascript:alert(1)" })];
      renderSheet();

      expect(screen.queryByRole("link", { name: "resume" })).toBeNull();
    });
  });
});
