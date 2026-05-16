import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OpportunityListCard } from "@/components/opportunities/opportunity-list-card";
import type { JobOpportunity } from "@/types/models/job-opportunity";

const mockSetSelectedOpportunity = vi.fn();
const mockSetIsModalOpen = vi.fn();

vi.mock("@/stores/useOpportunitiesStore", () => ({
  useOpportunitiesStore: () => ({
    setSelectedOpportunity: mockSetSelectedOpportunity,
    setIsModalOpen: mockSetIsModalOpen,
  }),
}));

vi.mock("@/hooks/useJobApplications", () => ({
  useUserApplications: () => ({ hasAppliedTo: () => false }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("@/lib/date-utils", () => ({
  formatRelativeTime: () => "2 days ago",
}));

const baseOpportunity: JobOpportunity = {
  id: "opp-1",
  title: "Forward Player",
  description: "Looking for a skilled forward",
  positionType: "Full-Time",
  level: "professional",
  status: "open",
  country: "ESP",
  city: "Barcelona",
  salary: 3000,
  currency: "EUR",
  benefits: ["Housing provided"],
  createdAt: "2026-05-01T00:00:00Z",
  clubId: "club-1",
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
  });

  it("renders job title and club name", () => {
    render(<OpportunityListCard {...baseOpportunity} />);
    expect(screen.getByText("Forward Player")).toBeInTheDocument();
    expect(screen.getByText("HC Barcelona")).toBeInTheDocument();
  });

  it("renders city and salary", () => {
    render(<OpportunityListCard {...baseOpportunity} />);
    expect(screen.getByText("Barcelona")).toBeInTheDocument();
    expect(screen.getByText(/3000.*EUR/)).toBeInTheDocument();
  });

  it("shows open badge for open status", () => {
    render(<OpportunityListCard {...baseOpportunity} />);
    expect(screen.getByText("open")).toBeInTheDocument();
  });

  it("shows filled badge for filled status", () => {
    render(<OpportunityListCard {...baseOpportunity} status="filled" />);
    expect(screen.getByText("filled")).toBeInTheDocument();
  });

  it("clicking card opens modal with correct opportunity", () => {
    render(<OpportunityListCard {...baseOpportunity} />);
    const card = screen
      .getByText("Forward Player")
      .closest('[class*="rounded-xl"]') as HTMLElement;
    fireEvent.click(card);
    expect(mockSetSelectedOpportunity).toHaveBeenCalledWith(
      expect.objectContaining({ id: "opp-1" }),
    );
    expect(mockSetIsModalOpen).toHaveBeenCalledWith(true);
  });

  it("shows published date", () => {
    render(<OpportunityListCard {...baseOpportunity} />);
    expect(screen.getByText(/published.*2 days ago/i)).toBeInTheDocument();
  });
});
