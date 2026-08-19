"use client";

import { useOpportunitiesStore } from "@/stores/useOpportunitiesStore";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  const triggerClass =
    "w-full bg-input border-border text-foreground text-sm hover:border-border-strong";

  return (
    <div className="flex flex-col gap-5 p-4 pt-6">
      {/* Level / Division */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="filter-level" className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">
          {t("filters.experience")}
        </label>
        <Select
          value={filters.level || "ALL"}
          onValueChange={(v) => setFilters({ level: v === "ALL" ? null : v })}
        >
          <SelectTrigger id="filter-level" className={triggerClass} aria-label={t("filters.experience")}>
            <SelectValue placeholder={t("filters.experience")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("filters.experience")}</SelectItem>
            <SelectItem value="PROFESSIONAL">Professional</SelectItem>
            <SelectItem value="AMATEUR">Amateur</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="filter-status" className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">
          {t("open")} / {t("filled")}
        </label>
        <Select
          value={filters.status || "ALL"}
          onValueChange={(v) => setFilters({ status: v === "ALL" ? null : v })}
        >
          <SelectTrigger id="filter-status" className={triggerClass} aria-label={`${t("open")} / ${t("filled")}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="open">{t("open")}</SelectItem>
            <SelectItem value="filled">{t("filled")}</SelectItem>
            <SelectItem value="closed">{t("closed")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Country */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="filter-country" className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">
          {t("filters.location")}
        </label>
        <Select
          value={filters.country || "ALL"}
          onValueChange={(v) => setFilters({ country: v === "ALL" ? null : v })}
        >
          <SelectTrigger id="filter-country" className={triggerClass} aria-label={t("filters.location")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Countries</SelectItem>
            {availableCountries.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Position Type */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="filter-position-type" className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">
          {t("positionFilter")}
        </label>
        <Select
          value={filters.positionType || "ALL"}
          onValueChange={(v) =>
            setFilters({ positionType: v === "ALL" ? null : v })
          }
        >
          <SelectTrigger id="filter-position-type" className={triggerClass} aria-label={t("positionFilter")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Positions</SelectItem>
            {POSITION_TYPES.map((pos) => (
              <SelectItem key={pos} value={pos}>
                {pos}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
