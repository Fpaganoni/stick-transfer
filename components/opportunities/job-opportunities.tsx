"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { useJobOpportunities } from "@/hooks/useJobOpportunities";
import { Error } from "../ui/error";
import { Skeleton } from "@/components/ui/skeleton";
import { OpportunityListCard } from "./opportunity-list-card";
import { OpportunityFilters } from "./opportunity-filters";
import { OpportunityDetailModal } from "./opportunity-detail-modal";
import { useTranslations } from "next-intl";
import { JobOpportunity } from "@/types/models/job-opportunity";
import { useOpportunitiesStore } from "@/stores/useOpportunitiesStore";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface JobOpportunitiesProps {
  initialData?: { jobOpportunities: JobOpportunity[] };
}

const HOCKEY_COUNTRIES = [
  "Argentina",
  "Australia",
  "Austria",
  "Belgium",
  "Canada",
  "Chile",
  "China",
  "Egypt",
  "England",
  "France",
  "Germany",
  "India",
  "Ireland",
  "Italy",
  "Japan",
  "Malaysia",
  "Netherlands",
  "New Zealand",
  "Pakistan",
  "Portugal",
  "Scotland",
  "South Africa",
  "South Korea",
  "Spain",
  "Switzerland",
  "United States",
  "Uruguay",
  "Wales",
];

export function JobOpportunities({ initialData }: JobOpportunitiesProps) {
  const t = useTranslations("opportunities");
  const { data, isLoading, error } = useJobOpportunities(undefined, initialData);
  const { filters, setSearchQuery } = useOpportunitiesStore();
  const [localSearch, setLocalSearch] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, setSearchQuery]);

  const availableCountries = useMemo(() => {
    const apiCountries = data?.jobOpportunities?.map((opp) => opp.country) ?? [];
    const merged = new Set([...apiCountries, ...HOCKEY_COUNTRIES]);
    return Array.from(merged).sort();
  }, [data]);

  const filteredOpportunities = useMemo(() => {
    if (!data?.jobOpportunities) return [];
    return data.jobOpportunities.filter((opportunity) => {
      if (localSearch) {
        const query = localSearch.toLowerCase();
        const matchesSearch =
          opportunity.title.toLowerCase().includes(query) ||
          opportunity.description.toLowerCase().includes(query) ||
          opportunity.city.toLowerCase().includes(query) ||
          opportunity.club.name.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      if (
        filters.level &&
        opportunity.level.toUpperCase() !== filters.level.toUpperCase()
      )
        return false;
      if (
        filters.status &&
        opportunity.status.toLowerCase() !== filters.status.toLowerCase()
      )
        return false;
      if (filters.country && opportunity.country !== filters.country)
        return false;
      if (
        filters.positionType &&
        !opportunity.positionType
          .toLowerCase()
          .includes(filters.positionType.toLowerCase())
      )
        return false;
      return true;
    });
  }, [data, localSearch, filters]);

  if (error) return <Error>{error.message}</Error>;
  if (!data && !isLoading) return <Error>{t("noData")}</Error>;

  const hasActiveFilters = Object.values(filters).some(Boolean) || localSearch;

  return (
    <div className="flex flex-col gap-4">
      {/* Search + Filter Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted"
          />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-foreground/5 border border-border text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className={`gap-2 shrink-0 ${hasActiveFilters ? "border-primary text-primary" : ""}`}
            >
              <SlidersHorizontal size={16} />
              <span className="hidden sm:inline">{t("filterVacancies")}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[320px] sm:w-[380px] p-0">
            <SheetHeader className="px-4 pt-6 pb-2">
              <SheetTitle>{t("filterVacancies")}</SheetTitle>
            </SheetHeader>
            <OpportunityFilters
              availableCountries={availableCountries}
              onClose={() => setIsSheetOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border p-4 space-y-3 min-h-[120px]"
            >
              <div className="flex gap-3">
                <Skeleton className="w-[60px] h-[60px] rounded-sm shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOpportunities.length > 0 ? (
            filteredOpportunities.map((jobOpportunity) => (
              <OpportunityListCard
                key={jobOpportunity.id}
                {...jobOpportunity}
              />
            ))
          ) : (
            <p className="col-span-full text-center text-foreground-muted py-12">
              {hasActiveFilters ? t("noResultsFound") : t("noOpportunities")}
            </p>
          )}
        </div>
      )}

      <OpportunityDetailModal />
    </div>
  );
}
