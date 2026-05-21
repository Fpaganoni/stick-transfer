"use client";

import { JobOpportunities } from "@/components/opportunities/job-opportunities";
import { useTranslations } from "next-intl";
import { JobOpportunity } from "@/types/models/job-opportunity";

interface OpportunitiesPageProps {
  initialData?: { jobOpportunities: JobOpportunity[] };
}

export function OpportunitiesPage({ initialData }: OpportunitiesPageProps) {
  const t = useTranslations("opportunities");

  return (
    <main className="max-w-2xl mx-auto pb-4 mb-22">
      <div className="sticky top-16 bg-background border-b border-border rounded-b-lg shadow-md px-4 py-4 z-20 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          {t("availablePositions")}
        </h2>
      </div>

      <JobOpportunities initialData={initialData} />
    </main>
  );
}
