"use client";

import { useOpportunitiesStore } from "@/stores/useOpportunitiesStore";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface OpportunityFiltersProps {
  availableCountries: string[];
  onClose?: () => void;
}

const POSITION_TYPES = [
  "Goalkeeper",
  "Defender",
  "Midfielder",
  "Attacker",
  "Coach",
  "Umpire",
  "Other",
];

export function OpportunityFilters({
  availableCountries,
  onClose,
}: OpportunityFiltersProps) {
  const t = useTranslations("opportunities");
  const { filters, setFilters, resetFilters } = useOpportunitiesStore();

  const handleApply = () => {
    onClose?.();
  };

  const handleReset = () => {
    resetFilters();
    onClose?.();
  };

  const selectClass =
    "w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 hover:border-border-strong transition-all cursor-pointer";

  return (
    <div className="flex flex-col gap-5 p-4 pt-6">
      {/* Level / Division */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">
          {t("filters.experience")}
        </label>
        <select
          value={filters.level || ""}
          onChange={(e) => setFilters({ level: e.target.value || null })}
          className={selectClass}
        >
          <option className="bg-surface text-foreground" value="">
            {t("filters.experience")}
          </option>
          <option
            className="bg-surface text-foreground"
            value="PROFESSIONAL"
          >
            Professional
          </option>
          <option className="bg-surface text-foreground" value="AMATEUR">
            Amateur
          </option>
        </select>
      </div>

      {/* Status */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">
          {t("open")} / {t("filled")}
        </label>
        <select
          value={filters.status || ""}
          onChange={(e) => setFilters({ status: e.target.value || null })}
          className={selectClass}
        >
          <option className="bg-surface text-foreground" value="">
            All
          </option>
          <option className="bg-surface text-foreground" value="open">
            {t("open")}
          </option>
          <option className="bg-surface text-foreground" value="filled">
            {t("filled")}
          </option>
          <option className="bg-surface text-foreground" value="closed">
            {t("closed")}
          </option>
        </select>
      </div>

      {/* Country */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">
          {t("filters.location")}
        </label>
        <select
          value={filters.country || ""}
          onChange={(e) => setFilters({ country: e.target.value || null })}
          className={selectClass}
        >
          <option className="bg-surface text-foreground" value="">
            All Countries
          </option>
          {availableCountries.map((country) => (
            <option
              key={country}
              value={country}
              className="bg-surface text-foreground"
            >
              {country}
            </option>
          ))}
        </select>
      </div>

      {/* Position Type */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">
          {t("positionFilter")}
        </label>
        <select
          value={filters.positionType || ""}
          onChange={(e) => setFilters({ positionType: e.target.value || null })}
          className={selectClass}
        >
          <option className="bg-surface text-foreground" value="">
            All Positions
          </option>
          {POSITION_TYPES.map((pos) => (
            <option
              key={pos}
              value={pos}
              className="bg-surface text-foreground"
            >
              {pos}
            </option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-2 border-t border-border">
        <Button className="w-full text-white-black" onClick={handleApply}>
          {t("applyFilters")}
        </Button>
        <Button variant="outline" className="w-full" onClick={handleReset}>
          {t("reset")}
        </Button>
      </div>
    </div>
  );
}
