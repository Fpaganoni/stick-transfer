/**
 * What: Tests for the profile "Saved jobs" tab.
 * Why: The list must come straight from savedJobOpportunities (server, per
 *      account) and never be derived from the full job list or localStorage.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UserSavedJobs } from "@/components/profile/user-saved-jobs";
import type { JobOpportunity } from "@/types/models/job-opportunity";

const { savedJobsState, toggleSaveMock, useJobOpportunitiesMock } = vi.hoisted(() => ({
  savedJobsState: {
    data: undefined as { savedJobOpportunities: unknown[] } | undefined,
    isLoading: false,
  },
  toggleSaveMock: vi.fn(),
  useJobOpportunitiesMock: vi.fn(),
}));

vi.mock("@/hooks/useSavedJobs", () => ({
  useSavedJobs: () => savedJobsState,
  useToggleSaveJob: () => ({ mutate: toggleSaveMock }),
}));

vi.mock("@/hooks/useJobOpportunities", () => ({
  useJobOpportunities: useJobOpportunitiesMock,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("@/lib/date-utils", () => ({
  formatRelativeTime: () => "2 days ago",
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ""} />
  ),
}));

function buildJob(id: string, title: string): JobOpportunity {
  return {
    id,
    title,
    description: "Description",
    positionType: "PLAYER",
    level: "PROFESSIONAL",
    country: "Spain",
    city: "Madrid",
    salary: 0,
    currency: "EUR",
    benefits: [],
    status: "open",
    isSavedByCurrentUser: true,
    createdAt: "2026-05-01T00:00:00Z",
    club: { id: "c1", name: "HC Madrid", isVerified: true } as JobOpportunity["club"],
  };
}

describe("UserSavedJobs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    savedJobsState.data = undefined;
    savedJobsState.isLoading = false;
  });

  it("lists exactly what the server returned as saved", () => {
    savedJobsState.data = {
      savedJobOpportunities: [buildJob("job-1", "Goalkeeper"), buildJob("job-2", "Umpire")],
    };

    render(<UserSavedJobs />);

    expect(screen.getByText("Goalkeeper")).toBeInTheDocument();
    expect(screen.getByText("Umpire")).toBeInTheDocument();
  });

  it("does not cross-reference the full opportunities list", () => {
    savedJobsState.data = { savedJobOpportunities: [buildJob("job-1", "Goalkeeper")] };

    render(<UserSavedJobs />);

    expect(useJobOpportunitiesMock).not.toHaveBeenCalled();
  });

  it("shows the empty state when nothing is saved", () => {
    savedJobsState.data = { savedJobOpportunities: [] };

    render(<UserSavedJobs />);

    expect(screen.getByText("savedJobs.noSavedJobs")).toBeInTheDocument();
  });

  it("shows a spinner while loading", () => {
    savedJobsState.isLoading = true;

    render(<UserSavedJobs />);

    expect(screen.queryByText("savedJobs.noSavedJobs")).not.toBeInTheDocument();
  });

  it("unsaves a job from its bookmark button", () => {
    const job = buildJob("job-1", "Goalkeeper");
    savedJobsState.data = { savedJobOpportunities: [job] };

    render(<UserSavedJobs />);
    fireEvent.click(screen.getByLabelText("Remove bookmark"));

    expect(toggleSaveMock).toHaveBeenCalledWith({ job, save: false });
  });
});
