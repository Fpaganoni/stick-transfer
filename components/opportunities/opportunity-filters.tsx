"use client";

import { useOpportunitiesStore } from "@/stores/useOpportunitiesStore";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { useState, useEffect } from "react";

interface OpportunityFiltersProps {
  availableCountries: string[];
}

export function OpportunityFilters({
  availableCountries,
}: OpportunityFiltersProps) {
  const t = useTranslations("opportunities");
  const { searchQuery, filters, setSearchQuery, setFilters, resetFilters } =
    useOpportunitiesStore();

  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, setSearchQuery]);

  const hasActiveFilters =
    searchQuery || filters.level || filters.status || filters.country;

  return (
    <div className="px-4 py-6 bg-background border-b border-border space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-muted"
        />
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-foreground/5 border border-border text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all duration-200"
        />
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Level Filter */}
        <select
          value={filters.level || ""}
          onChange={(e) => setFilters({ level: e.target.value || null })}
          className="px-3 py-2 rounded-lg bg-foreground/5 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all duration-200"
        >
          <option className="text-foreground bg-background/90" value="">
            {t("filters.experience")}
          </option>
          <option
            className="text-foreground bg-background/90"
            value="PROFESSIONAL"
          >
            Professional
          </option>
          <option className="text-foreground bg-background/90" value="AMATEUR">
            Amateur
          </option>
        </select>

        {/* Status Filter */}
        <select
          value={filters.status || ""}
          onChange={(e) => setFilters({ status: e.target.value || null })}
          className="px-3 py-2 rounded-lg bg-foreground/5 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all duration-200"
        >
          <option className="text-foreground bg-background/90" value="">
            {t("open")}/{t("filled")}
          </option>
          <option className="text-foreground bg-background/90" value="open">
            {t("open")}
          </option>
          <option className="text-foreground bg-background/90" value="filled">
            {t("filled")}
          </option>
          <option className="text-foreground bg-background/90" value="closed">
            {t("closed")}
          </option>
        </select>

        {/* Country Filter */}
        <select
          value={filters.country || ""}
          onChange={(e) => setFilters({ country: e.target.value || null })}
          className="px-3 py-2 rounded-lg bg-foreground/5 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all duration-200"
        >
          <option className="text-foreground bg-background/90" value="">
            {t("filters.location")}
          </option>
          {availableCountries.map((country) => (
            <option
              className="text-foreground bg-background/90"
              key={country}
              value={country}
            >
              {country}
            </option>
          ))}
        </select>

        {/* Reset Button */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="px-3 py-2 rounded-lg bg-foreground/10 hover:bg-foreground/20 text-foreground text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <X size={16} />
            <span className="hidden sm:inline">{t("reset")}</span>
          </button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2">
          {searchQuery && (
            <div className="px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-medium flex items-center gap-2">
              &quot;{searchQuery}&quot;
              <X
                size={14}
                className="cursor-pointer hover:opacity-70"
                onClick={() => setLocalSearch("")}
              />
            </div>
          )}
          {filters.level && (
            <div className="px-3 py-1 rounded-full bg-info/20 text-info text-xs font-medium flex items-center gap-2">
              {filters.level.charAt(0).toUpperCase() +
                filters.level.slice(1).toLowerCase()}
              <X
                size={14}
                className="cursor-pointer hover:opacity-70"
                onClick={() => setFilters({ level: null })}
              />
            </div>
          )}
          {filters.status && (
            <div className="px-3 py-1 rounded-full bg-success/20 text-success text-xs font-medium flex items-center gap-2">
              {filters.status.charAt(0).toUpperCase() +
                filters.status.slice(1).toLowerCase()}
              <X
                size={14}
                className="cursor-pointer hover:opacity-70"
                onClick={() => setFilters({ status: null })}
              />
            </div>
          )}
          {filters.country && (
            <div className="px-3 py-1 rounded-full bg-warning/20 text-warning text-xs font-medium flex items-center gap-2">
              {filters.country}
              <X
                size={14}
                className="cursor-pointer hover:opacity-70"
                onClick={() => setFilters({ country: null })}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
