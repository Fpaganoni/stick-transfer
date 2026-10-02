/**
 * What: Tests for the client-side filtering in JobOpportunities.
 * Why: The list fetches every opportunity and filters locally. Umpire jobs add
 *      three requirement filters on top of the position type; they must narrow
 *      the list correctly and never leak non-umpire jobs into an umpire search.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { JobOpportunities } from "@/components/opportunities/job-opportunities";
import { useOpportunitiesStore } from "@/stores/useOpportunitiesStore";
import type { JobOpportunity } from "@/types/models/job-opportunity";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("@/components/opportunities/opportunity-list-card", () => ({
  OpportunityListCard: ({ title }: { title: string }) => <div data-testid="job">{title}</div>,
}));
vi.mock("@/components/opportunities/opportunity-detail-modal", () => ({
  OpportunityDetailModal: () => null,
}));

const { state } = vi.hoisted(() => ({ state: { jobs: [] as unknown[] } }));

vi.mock("@/hooks/useJobOpportunities", () => ({
  useJobOpportunities: () => ({
    data: { jobOpportunities: state.jobs },
    isLoading: false,
    error: null,
  }),
}));

function job(overrides: Partial<JobOpportunity> & { id: string; title: string }): JobOpportunity {
  return {
    description: "desc",
    positionType: "PLAYER",
    level: "PROFESSIONAL",
    country: "Spain",
    city: "Madrid",
    salary: 0,
    currency: "EUR",
    benefits: [],
    status: "open",
    createdAt: "2026-05-01T00:00:00Z",
    club: { id: "c1", name: "HC Madrid" } as JobOpportunity["club"],
    ...overrides,
  };
}

const jobs = [
  job({ id: "1", title: "Player job", positionType: "PLAYER" }),
  job({ id: "2", title: "Coach job", positionType: "COACH" }),
  job({
    id: "3",
    title: "Umpire national turf men",
    positionType: "UMPIRE",
    licenseLevelRequired: "NACIONAL" as never,
    modality: "CESPED" as never,
    umpireCategory: "MASCULINO" as never,
  }),
  job({
    id: "4",
    title: "Umpire regional indoor veterans",
    positionType: "umpire", // the backend accepts any casing on create
    licenseLevelRequired: "REGIONAL" as never,
    modality: "INDOOR" as never,
    umpireCategory: "VETERANOS" as never,
  }),
  job({ id: "5", title: "Umpire no requirements", positionType: "UMPIRE" }),
];

type FilterState = ReturnType<typeof useOpportunitiesStore.getState>["filters"];

const emptyFilters: FilterState = {
  level: null,
  status: null,
  country: null,
  positionType: null,
  licenseLevelRequired: null,
  modality: null,
  umpireCategory: null,
};

const shown = () => screen.queryAllByTestId("job").map((el) => el.textContent);

function applyFilters(filters: Partial<FilterState>) {
  act(() => {
    useOpportunitiesStore.setState({ filters: { ...emptyFilters, ...filters } });
  });
}

describe("JobOpportunities filtering", () => {
  beforeEach(() => {
    state.jobs = jobs;
    useOpportunitiesStore.setState({ searchQuery: "", filters: { ...emptyFilters } });
  });

  it("shows everything without filters", () => {
    render(<JobOpportunities />);

    expect(shown()).toHaveLength(5);
  });

  it("filters by position type", () => {
    applyFilters({ positionType: "COACH" });
    render(<JobOpportunities />);

    expect(shown()).toEqual(["Coach job"]);
  });

  it("matches the position type case-insensitively", () => {
    applyFilters({ positionType: "UMPIRE" });
    render(<JobOpportunities />);

    expect(shown()).toEqual([
      "Umpire national turf men",
      "Umpire regional indoor veterans",
      "Umpire no requirements",
    ]);
  });

  it("filters umpire jobs by required licence", () => {
    applyFilters({ positionType: "UMPIRE", licenseLevelRequired: "NACIONAL" });
    render(<JobOpportunities />);

    expect(shown()).toEqual(["Umpire national turf men"]);
  });

  it("filters umpire jobs by modality", () => {
    applyFilters({ positionType: "UMPIRE", modality: "INDOOR" });
    render(<JobOpportunities />);

    expect(shown()).toEqual(["Umpire regional indoor veterans"]);
  });

  it("filters umpire jobs by category", () => {
    applyFilters({ positionType: "UMPIRE", umpireCategory: "MASCULINO" });
    render(<JobOpportunities />);

    expect(shown()).toEqual(["Umpire national turf men"]);
  });

  it("combines umpire filters", () => {
    applyFilters({
      positionType: "UMPIRE",
      licenseLevelRequired: "NACIONAL",
      modality: "INDOOR",
    });
    render(<JobOpportunities />);

    expect(shown()).toEqual([]);
  });

  it("hides umpire jobs without requirements once a requirement filter is on", () => {
    applyFilters({ positionType: "UMPIRE", modality: "CESPED" });
    render(<JobOpportunities />);

    expect(shown()).not.toContain("Umpire no requirements");
  });

  it("never lets non-umpire jobs through a requirement filter", () => {
    applyFilters({ modality: "CESPED" });
    render(<JobOpportunities />);

    expect(shown()).toEqual(["Umpire national turf men"]);
  });
});
