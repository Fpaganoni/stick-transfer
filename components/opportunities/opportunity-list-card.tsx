"use client";

import Link from "next/link";
import Image from "next/image";
import { Bookmark, ChevronRight } from "lucide-react";
import { Badge } from "../ui/badge";
import { JobOpportunity } from "@/types/models/job-opportunity";
import { formatRelativeTime } from "@/lib/date-utils";
import { useTranslations, useLocale } from "next-intl";
import { useOpportunitiesStore } from "@/stores/useOpportunitiesStore";
import { useUserApplications } from "@/hooks/useJobApplications";
import { useSavedJobsStore } from "@/stores/useSavedJobsStore";

type OpportunityListCardProps = JobOpportunity;

export function OpportunityListCard(opportunity: OpportunityListCardProps) {
  const t = useTranslations("opportunities");
  const locale = useLocale() as "en" | "es" | "fr";
  const { setSelectedOpportunity, setIsModalOpen } = useOpportunitiesStore();
  const { hasAppliedTo } = useUserApplications();
  const { toggleSave, isSaved } = useSavedJobsStore();

  const { id, title, club, country, positionType, status, level, createdAt } =
    opportunity;

  const saved = isSaved(id);

  const handleOpenModal = () => {
    setSelectedOpportunity(opportunity);
    setIsModalOpen(true);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSave(id);
  };

  const normalizedStatus = status.toLowerCase() as "open" | "closed" | "filled";
  const userAlreadyApplied = hasAppliedTo(id);

  return (
    <div
      className="bg-background rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={handleOpenModal}
    >
      <div className="p-4 flex gap-3 min-h-[120px]">
        {/* Club Logo */}
        <div className="shrink-0">
          {club.logo ? (
            <Image
              src={club.logo}
              alt={club.name}
              width={60}
              height={60}
              className="rounded-sm object-cover w-[60px] h-[60px]"
            />
          ) : (
            <div className="w-[60px] h-[60px] rounded-sm bg-primary/10 border border-border flex items-center justify-center text-lg font-bold text-primary">
              {club.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground text-sm leading-tight truncate">
                  {title}
                </h3>
                <Link
                  href={`/clubs/${club.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-primary hover:underline text-xs font-medium"
                >
                  {club.name}
                </Link>
              </div>
              <button
                onClick={handleBookmark}
                className={`shrink-0 p-1 rounded hover:bg-foreground/10 transition-colors ${
                  saved ? "text-primary" : "text-foreground-muted"
                }`}
                aria-label="Bookmark"
              >
                <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
              </button>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-xs text-foreground-muted">{country}</span>
              {positionType && (
                <span className="text-xs text-foreground-muted">
                  · {positionType}
                </span>
              )}
              {level && (
                <Badge
                  className={`text-xs py-0 px-1.5 ${
                    level.toLowerCase() === "professional"
                      ? "bg-info/20 text-info border-info/30"
                      : "bg-warning/20 text-warning border-warning/30"
                  }`}
                >
                  {level}
                </Badge>
              )}
              {normalizedStatus !== "open" && (
                <Badge className="text-xs py-0 px-1.5 bg-error/20 text-error border-error/30">
                  {t("filled")}
                </Badge>
              )}
              {userAlreadyApplied && (
                <Badge className="text-xs py-0 px-1.5 bg-accent/20 text-foreground border-accent/30">
                  {t("alreadyApplied")}
                </Badge>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-foreground-muted">
              {t("published")} {formatRelativeTime(createdAt, locale)}
            </span>
            <button
              onClick={handleOpenModal}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              {t("seeMore")}
              <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <ChevronRight size={12} className="text-white" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
