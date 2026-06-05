"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OpportunityListCard } from "@/components/opportunities/opportunity-list-card";
import { useJobOpportunities } from "@/hooks/useJobOpportunities";

export function VacanciesPreviewSection() {
  const t = useTranslations("landing.vacancies");
  const locale = useLocale();
  const { data, isLoading, isError } = useJobOpportunities({ limit: 6 });

  const opportunitiesHref =
    locale === "en" ? "/opportunities" : `/${locale}/opportunities`;

  if (isError) return null;

  return (
    <section id="vacancies" className="py-20 px-4 bg-muted/20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("title")}
          </h2>
          <p className="text-lg text-foreground-muted">{t("subtitle")}</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border p-4 space-y-3"
              >
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.jobOpportunities?.map((opportunity) => (
              <OpportunityListCard key={opportunity.id} {...opportunity} />
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Button asChild variant="outline" size="lg">
            <Link href={opportunitiesHref}>
              {t("viewAll")}
              <ArrowRight size={18} className="ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
