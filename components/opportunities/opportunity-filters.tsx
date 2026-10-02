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
import { POSITION_TYPES, isUmpireJob } from "@/lib/job-position-type";
import {
  UmpireLicenseLevel,
  UmpireModality,
  UmpireCategory,
} from "@/types/enums";

interface OpportunityFiltersProps {
  availableCountries: string[];
  onClose?: () => void;
}

export function OpportunityFilters({
  availableCountries,
  onClose,
}: OpportunityFiltersProps) {
  const t = useTranslations("opportunities");
  const tUmpire = useTranslations("umpire");
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
            setFilters({
              positionType: v === "ALL" ? null : v,
              // Requirements only exist on UMPIRE opportunities
              ...(isUmpireJob(v)
                ? {}
                : { licenseLevelRequired: null, modality: null, umpireCategory: null }),
            })
          }
        >
          <SelectTrigger id="filter-position-type" className={triggerClass} aria-label={t("positionFilter")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Positions</SelectItem>
            {POSITION_TYPES.map((pos) => (
              <SelectItem key={pos} value={pos}>
                {t(`positionTypes.${pos}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isUmpireJob(filters.positionType) && (
        <>
          <UmpireFilter
            id="filter-license-level"
            label={t("umpireJob.licenseLevel")}
            allLabel={t("umpireJob.any")}
            value={filters.licenseLevelRequired}
            onChange={(v) => setFilters({ licenseLevelRequired: v })}
            options={Object.values(UmpireLicenseLevel).map((v) => ({
              value: v,
              label: tUmpire(`licenseLevels.${v}`),
            }))}
            triggerClass={triggerClass}
          />
          <UmpireFilter
            id="filter-modality"
            label={t("umpireJob.modality")}
            allLabel={t("umpireJob.any")}
            value={filters.modality}
            onChange={(v) => setFilters({ modality: v })}
            options={Object.values(UmpireModality).map((v) => ({
              value: v,
              label: tUmpire(`modalities.${v}`),
            }))}
            triggerClass={triggerClass}
          />
          <UmpireFilter
            id="filter-umpire-category"
            label={t("umpireJob.category")}
            allLabel={t("umpireJob.any")}
            value={filters.umpireCategory}
            onChange={(v) => setFilters({ umpireCategory: v })}
            options={Object.values(UmpireCategory).map((v) => ({
              value: v,
              label: tUmpire(`categories.${v}`),
            }))}
            triggerClass={triggerClass}
          />
        </>
      )}

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

interface UmpireFilterProps {
  id: string;
  label: string;
  allLabel: string;
  value?: string | null;
  onChange: (value: string | null) => void;
  options: { value: string; label: string }[];
  triggerClass: string;
}

function UmpireFilter({
  id,
  label,
  allLabel,
  value,
  onChange,
  options,
  triggerClass,
}: UmpireFilterProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">
        {label}
      </label>
      <Select
        value={value || "ALL"}
        onValueChange={(v) => onChange(v === "ALL" ? null : v)}
      >
        <SelectTrigger id={id} className={triggerClass} aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">{allLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
