/**
 * What: Unit tests for OpportunityFilters component.
 * Why: Los filtros de oportunidades fueron extraídos de OpportunitiesPage hacia
 *      este componente dedicado que lee/escribe en useOpportunitiesStore.
 *      Estos tests validan que los controles de UI actualicen el estado global
 *      correctamente (searchQuery, level, status, country) y que el botón de
 *      reset limpie todos los filtros.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { OpportunityFilters } from "@/components/opportunities/opportunity-filters";
import { useOpportunitiesStore } from "@/stores/useOpportunitiesStore";

// next-intl ya está mockeado globalmente en tests/setup.ts
// (useTranslations devuelve la clave literal por defecto)

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Resetea la tienda Zustand entre tests para evitar contaminación de estado. */
function resetStore() {
  useOpportunitiesStore.setState({
    searchQuery: "",
    filters: { level: null, status: null, country: null },
    selectedOpportunity: null,
    isModalOpen: false,
  });
}

const defaultProps = {
  availableCountries: ["ESP", "ARG", "FRA"],
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe("OpportunityFilters", () => {
  beforeEach(resetStore);

  it("renders the search input", () => {
    render(<OpportunityFilters {...defaultProps} />);
    // El placeholder usa la clave de traducción (el mock devuelve la clave literal)
    expect(
      screen.getByPlaceholderText("searchPlaceholder"),
    ).toBeInTheDocument();
  });

  it("renders the level, status and country selects", () => {
    render(<OpportunityFilters {...defaultProps} />);
    const selects = screen.getAllByRole("combobox");
    // Debe haber al menos 3 selects: level, status, country
    expect(selects.length).toBeGreaterThanOrEqual(3);
  });

  it("renders country options from props", () => {
    render(<OpportunityFilters {...defaultProps} />);
    expect(screen.getByRole("option", { name: "ESP" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "ARG" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "FRA" })).toBeInTheDocument();
  });

  it("changing level select updates store filters.level", () => {
    render(<OpportunityFilters {...defaultProps} />);

    // El primer select es el de nivel (PROFESSIONAL / AMATEUR)
    const [levelSelect] = screen.getAllByRole("combobox");
    fireEvent.change(levelSelect, { target: { value: "PROFESSIONAL" } });

    expect(useOpportunitiesStore.getState().filters.level).toBe("PROFESSIONAL");
  });

  it("changing status select updates store filters.status", () => {
    render(<OpportunityFilters {...defaultProps} />);

    // El segundo select es el de estado
    const [, statusSelect] = screen.getAllByRole("combobox");
    fireEvent.change(statusSelect, { target: { value: "open" } });

    expect(useOpportunitiesStore.getState().filters.status).toBe("open");
  });

  it("changing country select updates store filters.country", () => {
    render(<OpportunityFilters {...defaultProps} />);

    // El tercer select es el de país
    const [, , countrySelect] = screen.getAllByRole("combobox");
    fireEvent.change(countrySelect, { target: { value: "ARG" } });

    expect(useOpportunitiesStore.getState().filters.country).toBe("ARG");
  });

  it("typing in search input updates store searchQuery (debounced)", async () => {
    render(<OpportunityFilters {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText("searchPlaceholder");

    fireEvent.change(searchInput, { target: { value: "Barcelona" } });

    // El debounce es de 300 ms — esperamos a que se propague
    await waitFor(
      () => {
        expect(useOpportunitiesStore.getState().searchQuery).toBe("Barcelona");
      },
      { timeout: 600 },
    );
  });

  it("reset button clears all filters and search query", async () => {
    // Precarga el store con filtros activos
    act(() => {
      useOpportunitiesStore.getState().setFilters({ level: "AMATEUR", status: "open" });
      useOpportunitiesStore.getState().setSearchQuery("Madrid");
    });

    render(<OpportunityFilters {...defaultProps} />);

    // El botón de reset solo aparece cuando hay filtros activos
    const resetBtn = screen.getByRole("button");
    fireEvent.click(resetBtn);

    const { filters, searchQuery } = useOpportunitiesStore.getState();
    expect(filters.level).toBeNull();
    expect(filters.status).toBeNull();
    expect(filters.country).toBeNull();
    expect(searchQuery).toBe("");
  });

  it("reset button is not rendered when no filters are active", () => {
    render(<OpportunityFilters {...defaultProps} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
