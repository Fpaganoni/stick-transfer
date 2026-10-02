/**
 * What: Tests for the admin overview umpire stats and role distribution data.
 * Why: Umpires are a role of their own: the dashboard must count them, show
 *      umpire opportunity activity, and include them in the users-by-role chart.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminOverviewPage from "@/app/[locale]/admin/page";
import { buildRoleDistribution } from "@/components/admin/charts/role-distribution-data";

const { state } = vi.hoisted(() => ({
  state: { stats: undefined as Record<string, number> | undefined, isLoading: false },
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/hooks/useAdminStats", () => ({
  useAdminStats: () => ({
    data: state.stats ? { adminDashboardStats: state.stats } : undefined,
    isLoading: state.isLoading,
    isError: false,
    refetch: vi.fn(),
  }),
}));

// Charts load lazily; render their data as text so it can be asserted
vi.mock("next/dynamic", () => ({
  default: () =>
    function ChartStub({ data }: { data: unknown }) {
      return <pre data-testid="chart">{JSON.stringify(data)}</pre>;
    },
}));

const stats = {
  totalUsersCount: 1001,
  playersCount: 25,
  coachesCount: 8,
  clubsCount: 12,
  umpiresCount: 37,
  superAdminsCount: 1,
  activeUsersCount: 1002,
  verifiedClubsCount: 10,
  pendingVerificationClubsCount: 2,
  unverifiedClubsCount: 1,
  rejectedClubsCount: 1,
  openJobsCount: 20,
  closedJobsCount: 8,
  filledJobsCount: 4,
  umpireJobsCount: 41,
  umpireApplicationsCount: 43,
  totalApplicationsCount: 1003,
  pendingApplicationsCount: 5,
  acceptedApplicationsCount: 0,
  rejectedApplicationsCount: 0,
  totalReportsCount: 1004,
  pendingReportsCount: 1,
  reviewedReportsCount: 1,
  actionTakenReportsCount: 1,
  publishedNewsCount: 6,
  draftNewsCount: 2,
  pendingClubMembershipsCount: 4,
  activeClubMembershipsCount: 10,
  newUsersLast7Days: 1005,
  newUsersLast30Days: 10,
};

describe("buildRoleDistribution", () => {
  it("includes umpires between clubs and superadmins", () => {
    expect(buildRoleDistribution(stats)).toEqual([
      { role: "PLAYER", count: 25 },
      { role: "COACH", count: 8 },
      { role: "CLUB", count: 12 },
      { role: "UMPIRE", count: 37 },
      { role: "SUPERADMIN", count: 1 },
    ]);
  });
});

describe("AdminOverviewPage umpire stats", () => {
  beforeEach(() => {
    state.stats = stats;
    state.isLoading = false;
  });

  it("shows the umpire totals", () => {
    render(<AdminOverviewPage />);

    expect(screen.getByText("stats.totalUmpires")).toBeInTheDocument();
    expect(screen.getByText("37")).toBeInTheDocument();
    expect(screen.getByText("stats.umpireJobs")).toBeInTheDocument();
    expect(screen.getByText("41")).toBeInTheDocument();
    expect(screen.getByText("stats.umpireApplications")).toBeInTheDocument();
    expect(screen.getByText("43")).toBeInTheDocument();
  });

  it("feeds umpires into the users-by-role chart", () => {
    render(<AdminOverviewPage />);

    const roleChart = screen
      .getAllByTestId("chart")
      .map((el) => el.textContent ?? "")
      .find((text) => text.includes('"role":"PLAYER"'));
    expect(roleChart).toContain('{"role":"UMPIRE","count":37}');
  });

  it("does not show umpire numbers while loading", () => {
    state.stats = undefined;
    state.isLoading = true;
    render(<AdminOverviewPage />);

    expect(screen.queryByText("37")).not.toBeInTheDocument();
  });
});
