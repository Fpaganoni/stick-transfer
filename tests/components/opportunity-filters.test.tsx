/**
 * What: Unit tests for OpportunityFilters component.
 * Why: Component was refactored to work inside a Sheet panel (no search bar).
 *      Tests validate that filter selects update the store and action buttons work.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { OpportunityFilters } from "@/components/opportunities/opportunity-filters";
import { useOpportunitiesStore } from "@/stores/useOpportunitiesStore";

function resetStore() {
  useOpportunitiesStore.setState({
    searchQuery: "",
    filters: { level: null, status: null, country: null, positionType: null },
    selectedOpportunity: null,
    isModalOpen: false,
  });
}

const defaultProps = {
  availableCountries: ["ESP", "ARG", "FRA"],
};

describe("OpportunityFilters", () => {
  beforeEach(resetStore);

  it("renders level, status, country, and positionType selects", () => {
    render(<OpportunityFilters {...defaultProps} />);
    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBe(4);
  });

  it("renders country options from props", async () => {
    render(<OpportunityFilters {...defaultProps} />);
    const [, , countryTrigger] = screen.getAllByRole("combobox");
    fireEvent.click(countryTrigger);
    expect(await screen.findByRole("option", { name: "ESP" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "ARG" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "FRA" })).toBeInTheDocument();
  });

  it("changing level select updates store filters.level", async () => {
    render(<OpportunityFilters {...defaultProps} />);
    const [levelTrigger] = screen.getAllByRole("combobox");
    fireEvent.click(levelTrigger);
    fireEvent.click(await screen.findByRole("option", { name: "Professional" }));
    expect(useOpportunitiesStore.getState().filters.level).toBe("PROFESSIONAL");
  });

  it("changing status select updates store filters.status", async () => {
    render(<OpportunityFilters {...defaultProps} />);
    const [, statusTrigger] = screen.getAllByRole("combobox");
    fireEvent.click(statusTrigger);
    fireEvent.click(await screen.findByRole("option", { name: "open" }));
    expect(useOpportunitiesStore.getState().filters.status).toBe("open");
  });

  it("changing country select updates store filters.country", async () => {
    render(<OpportunityFilters {...defaultProps} />);
    const [, , countryTrigger] = screen.getAllByRole("combobox");
    fireEvent.click(countryTrigger);
    fireEvent.click(await screen.findByRole("option", { name: "ARG" }));
    expect(useOpportunitiesStore.getState().filters.country).toBe("ARG");
  });

  it("reset button clears all filters", () => {
    act(() => {
      useOpportunitiesStore.getState().setFilters({ level: "AMATEUR", status: "open" });
    });

    render(<OpportunityFilters {...defaultProps} />);
    const resetBtn = screen.getByRole("button", { name: /reset/i });
    fireEvent.click(resetBtn);

    const { filters, searchQuery } = useOpportunitiesStore.getState();
    expect(filters.level).toBeNull();
    expect(filters.status).toBeNull();
    expect(filters.country).toBeNull();
    expect(searchQuery).toBe("");
  });

  it("apply button calls onClose callback", () => {
    const onClose = vi.fn();
    render(<OpportunityFilters {...defaultProps} onClose={onClose} />);
    const applyBtn = screen.getByRole("button", { name: /applyFilters/i });
    fireEvent.click(applyBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it("always renders action buttons", () => {
    render(<OpportunityFilters {...defaultProps} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(2);
  });
});
