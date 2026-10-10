/**
 * What: Tests for the Applications tab of the own profile (UserApplications).
 * Why: The tab used to join the applications with the public opportunities
 *      list on the client, so an application whose opportunity was not in that
 *      list silently disappeared. The opportunity now comes nested in
 *      userApplications, the status is translated (it showed the raw enum),
 *      WITHDRAWN is told apart and every item opens the opportunity detail.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserApplications } from "@/components/profile/user-applications";
import type { UserApplication } from "@/types/models/job-application";

const { applicationsState, openDetailMock, useJobOpportunitiesMock } = vi.hoisted(() => ({
  applicationsState: {
    applications: [] as UserApplication[],
    isLoading: false,
  },
  openDetailMock: vi.fn(),
  useJobOpportunitiesMock: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("@/hooks/useJobApplications", () => ({
  useUserApplications: () => applicationsState,
}));

vi.mock("@/hooks/useJobOpportunities", () => ({
  useJobOpportunities: useJobOpportunitiesMock,
  useOpenOpportunityDetail: () => openDetailMock,
}));

vi.mock("@/components/opportunities/opportunity-detail-modal", () => ({
  OpportunityDetailModal: () => null,
}));

vi.mock("@/components/ui/country-label", () => ({
  CountryLabel: ({ city, value }: { city?: string; value?: string }) => (
    <span>{[city, value].filter(Boolean).join(", ")}</span>
  ),
}));

vi.mock("@/lib/date-utils", () => ({
  formatRelativeTime: () => "2 days ago",
}));

function application(overrides: Partial<UserApplication> = {}): UserApplication {
  return {
    id: "app-1",
    jobOpportunityId: "job-1",
    status: "PENDING",
    appliedAt: "2026-10-01T00:00:00Z",
    jobOpportunity: {
      id: "job-1",
      title: "Goalkeeper wanted",
      city: "Madrid",
      country: "ES",
      salary: 1200,
      currency: "EUR",
      level: "PROFESSIONAL",
      status: "open",
      positionType: "PLAYER",
      club: { id: "c1", name: "HC Madrid", logo: undefined },
    },
    ...overrides,
  };
}

describe("UserApplications", () => {
  beforeEach(() => {
    applicationsState.applications = [];
    applicationsState.isLoading = false;
    openDetailMock.mockReset();
    useJobOpportunitiesMock.mockReset();
  });

  it("renders the nested opportunity without loading the opportunities list", () => {
    applicationsState.applications = [application()];

    render(<UserApplications />);

    expect(screen.getByText("Goalkeeper wanted")).toBeInTheDocument();
    expect(screen.getByText("HC Madrid")).toBeInTheDocument();
    expect(screen.getByText("Madrid, ES")).toBeInTheDocument();
    expect(screen.getByText("1200 EUR")).toBeInTheDocument();
    expect(useJobOpportunitiesMock).not.toHaveBeenCalled();
  });

  it("translates the status instead of showing the raw enum", () => {
    applicationsState.applications = [application({ status: "UNDER_REVIEW" })];

    render(<UserApplications />);

    expect(screen.getByText("applications.status.UNDER_REVIEW")).toBeInTheDocument();
    expect(screen.queryByText("UNDER_REVIEW")).not.toBeInTheDocument();
  });

  it("tells withdrawn applications apart from active ones", () => {
    applicationsState.applications = [
      application(),
      application({ id: "app-2", jobOpportunityId: "job-2", status: "WITHDRAWN" }),
    ];

    render(<UserApplications />);

    const [active, withdrawn] = screen.getAllByRole("button");
    expect(active).toHaveAttribute("data-status", "PENDING");
    expect(withdrawn).toHaveAttribute("data-status", "WITHDRAWN");
    expect(screen.getByText("applications.status.WITHDRAWN")).toBeInTheDocument();
  });

  it("opens the opportunity detail when an application is clicked", async () => {
    const user = userEvent.setup();
    const app = application();
    applicationsState.applications = [app];

    render(<UserApplications />);
    await user.click(screen.getByRole("button", { name: /Goalkeeper wanted/ }));

    expect(openDetailMock).toHaveBeenCalledWith(app.jobOpportunity);
  });

  it("shows the empty state when there are no applications", () => {
    render(<UserApplications />);

    expect(screen.getByText("applications.noApplications")).toBeInTheDocument();
  });

  it("shows placeholders, not the empty state, while loading", () => {
    applicationsState.isLoading = true;

    render(<UserApplications />);

    expect(screen.queryByText("applications.noApplications")).not.toBeInTheDocument();
    expect(screen.getByLabelText("applications.loading")).toHaveAttribute("aria-busy", "true");
  });
});
