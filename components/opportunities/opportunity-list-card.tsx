"use client";

import { MapPin, Calendar, Award } from "lucide-react";
import { Badge } from "../ui/badge";
import { JobOpportunity } from "@/types/models/job-opportunity";
import { formatRelativeTime } from "@/lib/date-utils";
import { useTranslations, useLocale } from "next-intl";
import { useOpportunitiesStore } from "@/stores/useOpportunitiesStore";
import { useUserApplications } from "@/hooks/useJobApplications";

type OpportunityListCardProps = JobOpportunity;

export function OpportunityListCard(opportunity: OpportunityListCardProps) {
  const t = useTranslations("opportunities");
  const locale = useLocale() as "en" | "es" | "fr";
  const { setSelectedOpportunity, setIsModalOpen } = useOpportunitiesStore();
  const { hasAppliedTo } = useUserApplications();

  const {
    id,
    title,
    description,
    club,
    country,
    city,
    status,
    salary,
    currency,
    createdAt,
    level,
  } = opportunity;

  const handleOpenModal = () => {
    setSelectedOpportunity(opportunity);
    setIsModalOpen(true);
  };

  // Normalize status to lowercase for comparison
  const normalizedStatus = status.toLowerCase() as "open" | "closed" | "filled";
  const userAlreadyApplied = hasAppliedTo(id);

  return (
    <div
      className="bg-background rounded-xl overflow-hidden shadow-md hover:shadow-lg group border-l-4 border-l-accent cursor-pointer transition-all duration-200 hover:border-l-accent-bright hover:translate-x-1"
      onClick={handleOpenModal}
    >
      <div className="p-4">
        <div className="mb-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              <p className="text-foreground-muted font-medium mt-1">
                {club.name}
              </p>
            </div>
            {level && (
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge
                  className={
                    normalizedStatus === "open"
                      ? "bg-success/30 text-foreground border-success/40"
                      : "bg-error/30 text-foreground border-error/40"
                  }
                >
                  {normalizedStatus === "open" ? t("open") : t("filled")}
                </Badge>
                {userAlreadyApplied && (
                  <Badge className="bg-accent/30 text-foreground border-accent/40">
                    {t("alreadyApplied")}
                  </Badge>
                )}
                <Badge className="bg-foreground/20 text-foreground border-foreground/30">
                  {country.slice(0, 4)}
                </Badge>
                <Badge
                  className={
                    level === "professional"
                      ? "bg-info/30 text-foreground border-info/40"
                      : "bg-warning/30 text-foreground border-warning/40"
                  }
                >
                  {level}
                </Badge>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-foreground-muted mb-4">
            <div className="flex items-center gap-1">
              <MapPin size={16} />
              <span>{city}</span>
            </div>
            {salary && (
              <div className="flex items-center gap-1">
                <Award size={16} />
                <span>
                  {salary} {currency}
                </span>
              </div>
            )}
          </div>

          <p className="text-sm text-foreground-muted mb-4">{description}</p>

          <div className="flex items-center gap-2 text-xs text-foreground-muted mb-4">
            <Calendar size={14} />
            <span>
              {t("published")} {formatRelativeTime(createdAt, locale)}.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
