"use client";

import { useJobOpportunities } from "@/hooks/useJobOpportunities";
import { Loader } from "../ui/loader";
import { Error } from "../ui/error";
import { OpportunityListCard } from "./opportunity-list-card";
import { OpportunityFilters } from "./opportunity-filters";
import { OpportunityDetailModal } from "./opportunity-detail-modal";
import { useTranslations } from "next-intl";
import { JobOpportunity } from "@/types/models/job-opportunity";
import { useOpportunitiesStore } from "@/stores/useOpportunitiesStore";
import { useMemo } from "react";

interface JobOpportunitiesProps {
  initialData?: { jobOpportunities: JobOpportunity[] };
}

export function JobOpportunities({ initialData }: JobOpportunitiesProps) {
  const t = useTranslations("opportunities");
  const { data, isLoading, error } = useJobOpportunities(
    undefined,
    initialData,
  );
  const { searchQuery, filters } = useOpportunitiesStore();

  // Extract unique countries for filter dropdown
  const availableCountries = useMemo(() => {
    if (!data?.jobOpportunities) return [];
    const countries = new Set(data.jobOpportunities.map((opp) => opp.country));
    return Array.from(countries).sort();
  }, [data]);

  // Filter opportunities based on search and filters
  const filteredOpportunities = useMemo(() => {
    if (!data?.jobOpportunities) return [];

    return data.jobOpportunities.filter((opportunity) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          opportunity.title.toLowerCase().includes(query) ||
          opportunity.description.toLowerCase().includes(query) ||
          opportunity.city.toLowerCase().includes(query) ||
          opportunity.club.name.toLowerCase().includes(query);

        if (!matchesSearch) return false;
      }

      // Level filter
      if (filters.level) {
        const normalizedLevel = opportunity.level.toLowerCase();
        if (normalizedLevel !== filters.level.toLowerCase()) {
          return false;
        }
      }

      // Status filter
      if (filters.status) {
        const normalizedStatus = opportunity.status.toLowerCase();
        if (normalizedStatus !== filters.status.toLowerCase()) {
          return false;
        }
      }

      // Country filter
      if (filters.country && opportunity.country !== filters.country) {
        return false;
      }

      return true;
    });
  }, [data, searchQuery, filters]);

  if (isLoading) {
    return <Loader>{t("loading")}</Loader>;
  }

  if (error) {
    return <Error>{error.message}</Error>;
  }

  if (!data) {
    return <Error>{t("noData")}</Error>;
  }

  return (
    <div className="flex flex-col">
      <OpportunityFilters availableCountries={availableCountries} />

      <div className="px-4 py-6 space-y-6">
        {filteredOpportunities.length > 0 ? (
          filteredOpportunities.map((jobOpportunity) => (
            <OpportunityListCard key={jobOpportunity.id} {...jobOpportunity} />
          ))
        ) : (
          <p className="text-center text-foreground py-8">
            {searchQuery || Object.values(filters).some(Boolean)
              ? t("noResultsFound")
              : t("noOpportunities")}
          </p>
        )}
      </div>

      <OpportunityDetailModal />
    </div>
  );
}
