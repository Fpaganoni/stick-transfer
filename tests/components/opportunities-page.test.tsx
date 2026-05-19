/**
 * What: Integration tests for OpportunitiesPage component.
 * Why: OpportunitiesPage is now a thin container that renders the heading and
 *      delegates filtering entirely to JobOpportunities + OpportunityFilters.
 *      These tests verify the invariant layout elements (heading + list).
 *      Filter logic is covered by opportunity-filters.test.tsx.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { OpportunitiesPage } from "@/components/pages/opportunities-page";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// Shallow-mock del hijo que requiere API real
vi.mock("@/components/opportunities/job-opportunities", () => ({
  JobOpportunities: () => <div data-testid="job-list">Job List</div>,
}));

describe("OpportunitiesPage", () => {
  it("renders the page heading", () => {
    render(<OpportunitiesPage />);
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });

  it("renders the job list", () => {
    render(<OpportunitiesPage />);
    expect(screen.getByTestId("job-list")).toBeInTheDocument();
  });
});
