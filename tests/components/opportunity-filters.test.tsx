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

describe("OpportunityFilters position types and umpire filters", () => {
  beforeEach(resetStore);

  async function openPositionType() {
    const comboboxes = screen.getAllByRole("combobox");
    fireEvent.click(comboboxes[3]);
  }

  it("offers exactly the position types the backend accepts", async () => {
    render(<OpportunityFilters {...defaultProps} />);
    await openPositionType();

    for (const type of ["PLAYER", "COACH", "STAFF", "UMPIRE", "OTHER"]) {
      expect(await screen.findByRole("option", { name: `positionTypes.${type}` })).toBeInTheDocument();
    }
    // Old free-text values would be rejected with a 400 by the backend
    expect(screen.queryByRole("option", { name: "Goalkeeper" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Umpire" })).not.toBeInTheDocument();
  });

  it("stores the enum value, not the label", async () => {
    render(<OpportunityFilters {...defaultProps} />);
    await openPositionType();
    fireEvent.click(await screen.findByRole("option", { name: "positionTypes.COACH" }));

    expect(useOpportunitiesStore.getState().filters.positionType).toBe("COACH");
  });

  it("hides the umpire filters for other position types", () => {
    render(<OpportunityFilters {...defaultProps} />);

    expect(screen.getAllByRole("combobox")).toHaveLength(4);
  });

  it("shows licence, modality and category filters when UMPIRE is selected", async () => {
    render(<OpportunityFilters {...defaultProps} />);
    await openPositionType();
    fireEvent.click(await screen.findByRole("option", { name: "positionTypes.UMPIRE" }));

    expect(useOpportunitiesStore.getState().filters.positionType).toBe("UMPIRE");
    expect(screen.getAllByRole("combobox")).toHaveLength(7);
    expect(screen.getByLabelText("umpireJob.licenseLevel")).toBeInTheDocument();
    expect(screen.getByLabelText("umpireJob.modality")).toBeInTheDocument();
    expect(screen.getByLabelText("umpireJob.category")).toBeInTheDocument();
  });

  it("stores the umpire filters as backend enum values", async () => {
    act(() => {
      useOpportunitiesStore.getState().setFilters({ positionType: "UMPIRE" });
    });
    render(<OpportunityFilters {...defaultProps} />);

    fireEvent.click(screen.getByLabelText("umpireJob.licenseLevel"));
    fireEvent.click(await screen.findByRole("option", { name: "licenseLevels.NACIONAL" }));
    fireEvent.click(screen.getByLabelText("umpireJob.modality"));
    fireEvent.click(await screen.findByRole("option", { name: "modalities.INDOOR" }));
    fireEvent.click(screen.getByLabelText("umpireJob.category"));
    fireEvent.click(await screen.findByRole("option", { name: "categories.FEMENINO" }));

    expect(useOpportunitiesStore.getState().filters).toMatchObject({
      licenseLevelRequired: "NACIONAL",
      modality: "INDOOR",
      umpireCategory: "FEMENINO",
    });
  });

  it("clears the umpire filters when switching away from UMPIRE", async () => {
    act(() => {
      useOpportunitiesStore.getState().setFilters({
        positionType: "UMPIRE",
        licenseLevelRequired: "NACIONAL",
        modality: "INDOOR",
        umpireCategory: "FEMENINO",
      });
    });
    render(<OpportunityFilters {...defaultProps} />);

    fireEvent.click(screen.getByLabelText("positionFilter"));
    fireEvent.click(await screen.findByRole("option", { name: "positionTypes.PLAYER" }));

    expect(useOpportunitiesStore.getState().filters).toMatchObject({
      positionType: "PLAYER",
      licenseLevelRequired: null,
      modality: null,
      umpireCategory: null,
    });
    expect(screen.getAllByRole("combobox")).toHaveLength(4);
  });

  it("clears the umpire filters when position type goes back to all", async () => {
    act(() => {
      useOpportunitiesStore.getState().setFilters({
        positionType: "UMPIRE",
        modality: "OUTDOOR",
      });
    });
    render(<OpportunityFilters {...defaultProps} />);

    fireEvent.click(screen.getByLabelText("positionFilter"));
    fireEvent.click(await screen.findByRole("option", { name: "All Positions" }));

    expect(useOpportunitiesStore.getState().filters).toMatchObject({
      positionType: null,
      modality: null,
    });
  });
});
