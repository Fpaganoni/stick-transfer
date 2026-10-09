/**
 * What: Tests for the opportunities store filters.
 * Why: The umpire-only filters ride on the same store as the common ones;
 *      resetting must clear all of them or a stale licence filter would keep
 *      hiding opportunities after the user hits "reset".
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useOpportunitiesStore } from "@/stores/useOpportunitiesStore";

const emptyFilters = {
  level: null,
  status: null,
  country: null,
  positionType: null,
  licenseLevelRequired: null,
  modality: null,
  umpireCategory: null,
};

describe("useOpportunitiesStore filters", () => {
  beforeEach(() => {
    useOpportunitiesStore.setState({ searchQuery: "", filters: { ...emptyFilters } });
  });

  it("starts with every filter empty, including the umpire ones", () => {
    expect(useOpportunitiesStore.getState().filters).toEqual(emptyFilters);
  });

  it("setFilters merges without losing other filters", () => {
    const { setFilters } = useOpportunitiesStore.getState();
    setFilters({ positionType: "UMPIRE" });
    setFilters({ modality: "OUTDOOR" });

    expect(useOpportunitiesStore.getState().filters).toMatchObject({
      positionType: "UMPIRE",
      modality: "OUTDOOR",
    });
  });

  it("resetFilters clears the umpire filters and the search", () => {
    const { setFilters, setSearchQuery, resetFilters } = useOpportunitiesStore.getState();
    setFilters({
      positionType: "UMPIRE",
      licenseLevelRequired: "NACIONAL",
      modality: "INDOOR",
      umpireCategory: "MAYORES",
    });
    setSearchQuery("madrid");

    resetFilters();

    const state = useOpportunitiesStore.getState();
    expect(state.filters).toEqual(emptyFilters);
    expect(state.searchQuery).toBe("");
  });
});
