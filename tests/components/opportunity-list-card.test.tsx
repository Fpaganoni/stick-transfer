import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OpportunityListCard } from "@/components/opportunities/opportunity-list-card";
import type { JobOpportunity } from "@/types/models/job-opportunity";

const mockSetSelectedOpportunity = vi.fn();
const mockSetIsModalOpen = vi.fn();
const mockOpenLoginModal = vi.fn();

vi.mock("@/stores/useOpportunitiesStore", () => ({
  useOpportunitiesStore: () => ({
    setSelectedOpportunity: mockSetSelectedOpportunity,
    setIsModalOpen: mockSetIsModalOpen,
  }),
}));

vi.mock("@/hooks/useJobApplications", () => ({
  useUserApplications: () => ({ hasAppliedTo: () => false }),
}));

vi.mock("@/stores/useAuthStore", () => ({
  useAuthStore: () => ({ isLoggedIn: false }),
}));

vi.mock("@/stores/useUIStore", () => ({
  useUIStore: () => ({ openLoginModal: mockOpenLoginModal }),
}));

vi.mock("@/stores/useSavedJobsStore", () => ({
  useSavedJobsStore: () => ({ toggleSave: vi.fn(), isSaved: () => false }),
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

const baseOpportunity: JobOpportunity = {
  id: "opp-1",
  title: "Forward Player",
  description: "Looking for a skilled forward",
  positionType: "Full-Time",
  level: "professional",
  status: "open",
  country: "Spain",
  city: "Barcelona",
  salary: 3000,
  currency: "EUR",
  benefits: ["Housing provided"],
  createdAt: "2026-05-01T00:00:00Z",
  club: {
    id: "club-1",
    name: "HC Barcelona",
    isVerified: true,
  },
};

describe("OpportunityListCard", () => {
  beforeEach(() => {
    mockSetSelectedOpportunity.mockReset();
    mockSetIsModalOpen.mockReset();
    mockOpenLoginModal.mockReset();
  });

  it("renders without errors", () => {
    const { container } = render(<OpportunityListCard {...baseOpportunity} />);
    expect(container.firstChild).not.toBeNull();
  });

  it("renders job title and club name", () => {
    render(<OpportunityListCard {...baseOpportunity} />);
    expect(screen.getByText("Forward Player")).toBeInTheDocument();
    expect(screen.getByText("HC Barcelona")).toBeInTheDocument();
  });

  it("renders country", () => {
    render(<OpportunityListCard {...baseOpportunity} />);
    expect(screen.getByText("Spain")).toBeInTheDocument();
  });

  it("shows filled badge for filled status", () => {
    render(<OpportunityListCard {...baseOpportunity} status="filled" />);
    expect(screen.getByText("filled")).toBeInTheDocument();
  });

  it("shows club initial when no logo", () => {
    render(<OpportunityListCard {...baseOpportunity} />);
    expect(screen.getByText("H")).toBeInTheDocument();
  });

  it("clicking see more opens modal with correct opportunity", () => {
    render(<OpportunityListCard {...baseOpportunity} />);
    fireEvent.click(screen.getByText("seeMore"));
    expect(mockSetSelectedOpportunity).toHaveBeenCalledWith(
      expect.objectContaining({ id: "opp-1" }),
    );
    expect(mockSetIsModalOpen).toHaveBeenCalledWith(true);
  });

  it("bookmark click opens login modal when not authenticated", () => {
    render(<OpportunityListCard {...baseOpportunity} />);
    const bookmarkBtn = screen.getByLabelText("Bookmark");
    fireEvent.click(bookmarkBtn);
    expect(mockOpenLoginModal).toHaveBeenCalled();
  });

  it("shows published date", () => {
    render(<OpportunityListCard {...baseOpportunity} />);
    expect(screen.getByText(/published/i)).toBeInTheDocument();
  });
});

describe("OpportunityListCard umpire opportunities", () => {
  const umpireJob: JobOpportunity = {
    ...baseOpportunity,
    title: "Umpire - Division de Honor",
    positionType: "UMPIRE",
    licenseLevelRequired: "NACIONAL" as never,
    modality: "CESPED" as never,
    umpireCategory: "MASCULINO" as never,
    matchDate: "2026-11-15T10:00:00Z",
  };

  it("shows the position type as a translated label", () => {
    render(<OpportunityListCard {...umpireJob} />);
    expect(screen.getByText(/positionTypes\.UMPIRE/)).toBeInTheDocument();
  });

  it("shows the licence, modality and category it requires", () => {
    render(<OpportunityListCard {...umpireJob} />);
    expect(screen.getByText("licenseLevels.NACIONAL")).toBeInTheDocument();
    expect(screen.getByText("modalities.CESPED")).toBeInTheDocument();
    expect(screen.getByText("categories.MASCULINO")).toBeInTheDocument();
  });

  it("shows the match date", () => {
    render(<OpportunityListCard {...umpireJob} />);
    expect(screen.getByText(/2026/, { selector: "[data-testid='match-date']" })).toBeInTheDocument();
  });

  it("shows nothing extra for an umpire job with no requirements", () => {
    const { container } = render(
      <OpportunityListCard
        {...umpireJob}
        licenseLevelRequired={null}
        modality={null}
        umpireCategory={null}
        matchDate={null}
      />,
    );
    expect(screen.queryByTestId("umpire-job-details")).not.toBeInTheDocument();
    expect(container.textContent).not.toMatch(/null|undefined/);
  });

  it("does not show umpire details on other opportunities", () => {
    render(<OpportunityListCard {...baseOpportunity} />);
    expect(screen.queryByTestId("umpire-job-details")).not.toBeInTheDocument();
  });

  it("keeps showing legacy free-text position types untouched", () => {
    render(<OpportunityListCard {...baseOpportunity} />);
    expect(screen.getByText(/Full-Time/)).toBeInTheDocument();
  });
});
