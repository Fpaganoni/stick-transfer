/**
 * What: Tests for ClubProfileView, the single club profile (owner and public).
 * Why: /profile, /clubs/[id] and /profile/[username] used to render three
 *      different club screens. A CLUB account is the club itself, so one view
 *      must show it everywhere: only the Profile and Vacancies tabs, follow and
 *      report on the CLUB axis, no follow or report on the owner's own club, and
 *      the verification banner only to the owner (the first one to register a
 *      club name takes it, so verification is the defence).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClubProfileView } from "@/components/clubs/club-profile-view";
import type { Club } from "@/types/models/club";
import type { JobOpportunity } from "@/types/models/job-opportunity";

const { state, openLoginModal, toggleFollow, createReport, useClubVacanciesCall } = vi.hoisted(
  () => ({
    state: {
      club: null as Club | null,
      isLoading: false,
      error: null as Error | null,
      vacancies: [] as JobOpportunity[],
      isLoggedIn: true,
      currentUserId: "viewer-1" as string | null,
      isFollowing: false,
      canFollow: true,
      canContact: false,
      unanswered: { counts: {}, isComplete: true } as
        | { counts: Record<string, number>; isComplete: boolean }
        | undefined,
    },
    openLoginModal: vi.fn(),
    toggleFollow: vi.fn(),
    createReport: vi.fn(),
    useClubVacanciesCall: vi.fn(),
  }),
);

vi.mock("@/hooks/useClubs", () => ({
  useClub: () => ({
    data: state.club ? { club: state.club } : undefined,
    isLoading: state.isLoading,
    error: state.error,
  }),
}));

vi.mock("@/hooks/useClubVacancies", () => ({
  useClubVacancies: (clubId: string, status?: string) => {
    useClubVacanciesCall(clubId, status);
    return { data: state.vacancies, isLoading: false };
  },
  // The owner's actions have their own tests (club-vacancy-owner-row, club-applicants-sheet)
  useUnansweredApplicationCounts: () => ({ data: state.unanswered }),
  useUpdateVacancyStatus: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteVacancy: () => ({ mutate: vi.fn(), isPending: false }),
  useJobApplicants: () => ({ data: [], isLoading: false, isError: false }),
  useUpdateApplicationStatus: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/hooks/useClubFollow", () => ({
  useClubFollow: () => ({
    isFollowing: state.isFollowing,
    canFollow: state.canFollow,
    isPending: false,
    toggle: toggleFollow,
  }),
}));

vi.mock("@/hooks/useReport", () => ({
  useCreateReport: () => ({ mutate: createReport, isPending: false }),
}));

vi.mock("@/hooks/useRole", () => ({
  useRole: () => ({ isClub: state.canContact, isSuperAdmin: false }),
}));

vi.mock("@/stores/useAuthStore", () => ({
  useAuthStore: (selector?: (s: { user: { id: string } | null; isLoggedIn: boolean }) => unknown) => {
    const slice = {
      user: state.currentUserId ? { id: state.currentUserId } : null,
      isLoggedIn: state.isLoggedIn,
    };
    return selector ? selector(slice) : slice;
  },
}));

vi.mock("@/stores/useUIStore", () => ({
  useUIStore: () => ({ openLoginModal }),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/components/opportunities/opportunity-detail-modal", () => ({
  OpportunityDetailModal: () => null,
}));
vi.mock("@/components/opportunities/opportunity-list-card", () => ({
  OpportunityListCard: (job: JobOpportunity) => <div data-testid="vacancy-card">{job.title}</div>,
}));
vi.mock("@/components/clubs/verification-modal", () => ({
  VerificationModal: () => <div>verification-modal</div>,
}));

const completeClub: Club = {
  id: "club-1",
  name: "San Isidro Club",
  logo: "https://res.cloudinary.com/demo/crest.png",
  coverImage: "https://res.cloudinary.com/demo/cover.jpg",
  description: "Founded to play hockey.",
  city: "Buenos Aires",
  country: "AR",
  league: "Metropolitan A",
  foundedYear: 1935,
  benefits: ["Housing", "Meals"],
  isVerified: true,
  verificationStatus: "VERIFIED",
  website: "https://sanisidroclub.com.ar",
  instagram: "sanisidroclub",
  followersCount: 12,
  isFollowedByCurrentUser: false,
  user: { id: "club-1", username: "sanisidro" },
};

function makeJob(overrides: Partial<JobOpportunity> = {}): JobOpportunity {
  return {
    id: "job-1",
    title: "Goalkeeper",
    status: "OPEN",
    club: { id: "club-1", name: "San Isidro Club" },
    ...overrides,
  } as JobOpportunity;
}

describe("ClubProfileView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.club = { ...completeClub };
    state.isLoading = false;
    state.error = null;
    state.vacancies = [];
    state.isLoggedIn = true;
    state.currentUserId = "viewer-1";
    state.isFollowing = false;
    state.canFollow = true;
    state.canContact = false;
    state.unanswered = { counts: {}, isComplete: true };
  });

  describe("loading and errors", () => {
    it("shows the loader while the club loads", () => {
      state.club = null;
      state.isLoading = true;

      render(<ClubProfileView clubId="club-1" mode="public" />);

      expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
      expect(screen.getByText("loading")).toBeInTheDocument();
    });

    it("shows a not found message when the club does not exist", () => {
      state.club = null;

      render(<ClubProfileView clubId="club-1" mode="public" />);

      expect(screen.getByText("notFound")).toBeInTheDocument();
    });
  });

  describe("the header, same in both modes", () => {
    it.each(["public", "owner"] as const)("shows the club identity in %s mode", (mode) => {
      render(<ClubProfileView clubId="club-1" mode={mode} />);

      expect(screen.getByRole("heading", { level: 1, name: "San Isidro Club" })).toBeInTheDocument();
      expect(screen.getByText("@sanisidro")).toBeInTheDocument();
    });

    it("renders the crest uncropped, never as a circle", () => {
      render(<ClubProfileView clubId="club-1" mode="public" />);

      const crest = screen.getByRole("img", { name: "San Isidro Club" });
      expect(crest).toHaveClass("object-contain");
      expect(crest).not.toHaveClass("rounded-full");
    });

    it("renders the club initial when there is no crest", () => {
      state.club = { ...completeClub, logo: undefined };

      render(<ClubProfileView clubId="club-1" mode="public" />);

      expect(screen.getByRole("img", { name: "San Isidro Club" })).toHaveTextContent("S");
    });

    it("shows the verified badge only for a verified club", () => {
      const { unmount } = render(<ClubProfileView clubId="club-1" mode="public" />);
      expect(screen.getByTestId("verified-badge")).toBeInTheDocument();
      unmount();

      state.club = { ...completeClub, isVerified: false, verificationStatus: "UNVERIFIED" };
      render(<ClubProfileView clubId="club-1" mode="public" />);
      expect(screen.queryByTestId("verified-badge")).toBeNull();
    });
  });

  describe("tabs", () => {
    it.each(["public", "owner"] as const)("has only Profile and Vacancies in %s mode", (mode) => {
      render(<ClubProfileView clubId="club-1" mode={mode} />);

      const tabs = screen.getAllByRole("tab").map((tab) => tab.textContent);
      expect(tabs).toEqual(["tabs.profile", "tabs.vacancies"]);
    });

    it("shows the details and the contact links on the Profile tab", () => {
      render(<ClubProfileView clubId="club-1" mode="public" />);

      expect(screen.getByText("Founded to play hockey.")).toBeInTheDocument();
      expect(screen.getByText("Metropolitan A")).toBeInTheDocument();
      expect(screen.getByText("1935")).toBeInTheDocument();
      expect(screen.getByText("Housing")).toBeInTheDocument();
      expect(screen.getByText("Meals")).toBeInTheDocument();
      const contact = screen.getByRole("region", { name: "contactAndSocial" });
      expect(within(contact).getByRole("link", { name: /website/ })).toHaveAttribute(
        "href",
        "https://sanisidroclub.com.ar",
      );
    });

    it("never links a javascript: website", () => {
      state.club = { ...completeClub, website: "javascript:alert(1)" };

      render(<ClubProfileView clubId="club-1" mode="public" />);

      expect(screen.queryByRole("link", { name: /website/ })).toBeNull();
    });
  });

  describe("public mode", () => {
    it("lists only the open vacancies of the club", async () => {
      state.vacancies = [makeJob(), makeJob({ id: "job-2", title: "Coach" })];
      const user = userEvent.setup();

      render(<ClubProfileView clubId="club-1" mode="public" />);
      await user.click(screen.getByRole("tab", { name: "tabs.vacancies" }));

      expect(useClubVacanciesCall).toHaveBeenLastCalledWith("club-1", "OPEN");
      expect(screen.getAllByTestId("vacancy-card")).toHaveLength(2);
      expect(screen.queryByRole("link", { name: "publish" })).toBeNull();
    });

    it("explains that there are no open vacancies", async () => {
      const user = userEvent.setup();

      render(<ClubProfileView clubId="club-1" mode="public" />);
      await user.click(screen.getByRole("tab", { name: "tabs.vacancies" }));

      expect(screen.getByText("noVacancies")).toBeInTheDocument();
    });

    it("follows the club from the follow button", async () => {
      const user = userEvent.setup();

      render(<ClubProfileView clubId="club-1" mode="public" />);
      await user.click(screen.getByRole("button", { name: "header.follow" }));

      expect(toggleFollow).toHaveBeenCalledTimes(1);
    });

    it("offers to unfollow a club that is already followed", () => {
      state.isFollowing = true;

      render(<ClubProfileView clubId="club-1" mode="public" />);

      expect(screen.getByRole("button", { name: "header.unfollow" })).toBeInTheDocument();
    });

    it("sends a visitor without a session to log in instead of following", async () => {
      state.isLoggedIn = false;
      state.currentUserId = null;
      state.canFollow = false;
      const user = userEvent.setup();

      render(<ClubProfileView clubId="club-1" mode="public" />);
      await user.click(screen.getByRole("button", { name: "header.follow" }));

      expect(openLoginModal).toHaveBeenCalledTimes(1);
      expect(toggleFollow).not.toHaveBeenCalled();
      expect(screen.getByText("visitor.createAccount")).toBeInTheDocument();
    });

    it("reports the club on the CLUB axis", async () => {
      const user = userEvent.setup();

      render(<ClubProfileView clubId="club-1" mode="public" />);
      await user.click(screen.getByRole("button", { name: "header.more" }));
      await user.click(await screen.findByRole("menuitem", { name: "header.report" }));
      await user.selectOptions(screen.getByLabelText("Reason"), "SPAM");
      await user.click(screen.getByRole("button", { name: "Submit Report" }));

      expect(createReport).toHaveBeenCalledWith(
        { targetType: "CLUB", targetId: "club-1", reason: "SPAM", description: undefined },
        expect.any(Object),
      );
    });

    it("hides the verification banner and the onboarding notice from visitors", () => {
      state.club = { ...completeClub, logo: undefined, description: "", isVerified: false, verificationStatus: "UNVERIFIED" };

      render(<ClubProfileView clubId="club-1" mode="public" />);

      expect(screen.queryByText("unverifiedTitle")).toBeNull();
      expect(screen.queryByRole("status")).toBeNull();
    });
  });

  describe("owner mode", () => {
    it("offers to edit the profile and never to follow or report the own club", () => {
      state.canContact = true; // even a club viewer has nothing to contact or report here

      render(<ClubProfileView clubId="club-1" mode="owner" />);

      expect(screen.getByRole("link", { name: "editProfile" })).toHaveAttribute("href", "/profile/edit");
      expect(screen.queryByRole("button", { name: "header.follow" })).toBeNull();
      expect(screen.queryByRole("button", { name: "header.unfollow" })).toBeNull();
      expect(screen.queryByRole("button", { name: "header.more" })).toBeNull();
      expect(screen.queryByText("header.report")).toBeNull();
    });

    it("keeps the share button", () => {
      render(<ClubProfileView clubId="club-1" mode="owner" />);

      expect(screen.getByRole("button", { name: "header.share" })).toBeInTheDocument();
    });

    it("shows the verification banner with the upload button until the club is verified", async () => {
      state.club = { ...completeClub, isVerified: false, verificationStatus: "UNVERIFIED" };
      const user = userEvent.setup();

      render(<ClubProfileView clubId="club-1" mode="owner" />);

      expect(screen.getByText("unverifiedTitle")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "verifyButton" }));
      expect(screen.getByText("verification-modal")).toBeInTheDocument();
    });

    it("puts the verification banner above everything else", () => {
      state.club = { ...completeClub, isVerified: false, verificationStatus: "UNVERIFIED" };

      render(<ClubProfileView clubId="club-1" mode="owner" />);

      const banner = screen.getByText("unverifiedTitle");
      const title = screen.getByRole("heading", { level: 1 });
      expect(banner.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("hides the banner once the club is verified", () => {
      render(<ClubProfileView clubId="club-1" mode="owner" />);

      expect(screen.queryByText("unverifiedTitle")).toBeNull();
    });

    it("asks to complete the profile while the crest or the description is missing", () => {
      state.club = { ...completeClub, logo: undefined };

      render(<ClubProfileView clubId="club-1" mode="owner" />);

      const notice = screen.getByRole("status");
      expect(within(notice).getByText("title")).toBeInTheDocument();
      expect(within(notice).getByText("missing.crest")).toBeInTheDocument();
      expect(within(notice).queryByText("missing.description")).toBeNull();
    });

    it("drops the notice once the profile is complete", () => {
      render(<ClubProfileView clubId="club-1" mode="owner" />);

      expect(screen.queryByRole("status")).toBeNull();
    });

    it("does not let a vacancy be deleted until its unanswered applications are known", async () => {
      state.vacancies = [makeJob()];
      state.unanswered = undefined; // the counts are still loading, or failed
      const user = userEvent.setup();

      render(<ClubProfileView clubId="club-1" mode="owner" />);
      await user.click(screen.getByRole("tab", { name: "tabs.vacancies" }));

      expect(screen.getByRole("button", { name: "delete" })).toBeDisabled();
    });

    it("treats a vacancy missing from an incomplete count as unknown, not as zero", async () => {
      state.vacancies = [makeJob(), makeJob({ id: "job-2", title: "Coach" })];
      state.unanswered = { counts: { "job-1": 0 }, isComplete: false };
      const user = userEvent.setup();

      render(<ClubProfileView clubId="club-1" mode="owner" />);
      await user.click(screen.getByRole("tab", { name: "tabs.vacancies" }));

      const deletes = screen.getAllByRole("button", { name: "delete" });
      expect(deletes[0]).toBeEnabled();
      expect(deletes[1]).toBeDisabled();
    });

    it("lists every vacancy of the club and links to publish a new one", async () => {
      state.vacancies = [makeJob(), makeJob({ id: "job-2", title: "Coach", status: "CLOSED" })];
      const user = userEvent.setup();

      render(<ClubProfileView clubId="club-1" mode="owner" />);
      await user.click(screen.getByRole("tab", { name: "tabs.vacancies" }));

      expect(useClubVacanciesCall).toHaveBeenLastCalledWith("club-1", undefined);
      expect(screen.getAllByTestId("vacancy-card")).toHaveLength(2);
      expect(screen.getByRole("link", { name: "publish" })).toHaveAttribute(
        "href",
        "/opportunities/new",
      );
    });
  });
});
