"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Briefcase, Plus } from "lucide-react";
import { ClubVacancyOwnerRow } from "@/components/clubs/club-vacancy-owner-row";
import { OpportunityListCard } from "@/components/opportunities/opportunity-list-card";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useClubVacancies, useUnansweredApplicationCounts } from "@/hooks/useClubVacancies";

interface ClubVacanciesTabProps {
  clubId: string;
  mode: "owner" | "public";
}

/**
 * Visitors see the OPEN vacancies of the club. The owner sees all of them,
 * whatever their status, and can publish a new one.
 */
export function ClubVacanciesTab({ clubId, mode }: ClubVacanciesTabProps) {
  const t = useTranslations("clubProfile.vacancies");
  const isOwner = mode === "owner";
  const { data: vacancies = [], isLoading } = useClubVacancies(
    clubId,
    isOwner ? undefined : "OPEN",
  );
  // Only the owner can read (and needs) the applications waiting for an answer
  const { data: unanswered } = useUnansweredApplicationCounts(isOwner ? clubId : null);

  // null = unknown (still loading, failed, or the page was full): never read it as zero
  const unansweredFor = (vacancyId: string): number | null => {
    const known = unanswered?.counts[vacancyId];
    if (known !== undefined) return known;
    return unanswered?.isComplete ? 0 : null;
  };

  return (
    <div className="space-y-3">
      {isOwner && (
        <div className="flex justify-end">
          <Link
            href="/opportunities/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white-black font-semibold rounded-lg hover:bg-primary-hover transition-colors text-sm"
          >
            <Plus aria-hidden size={16} />
            {t("publish")}
          </Link>
        </div>
      )}

      {isLoading ? (
        Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-24 rounded-xl bg-surface-elevated animate-pulse" />
        ))
      ) : vacancies.length === 0 ? (
        <Empty className="border border-dashed border-border">
          <EmptyMedia variant="icon">
            <Briefcase />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>{t(isOwner ? "ownerEmpty" : "noVacancies")}</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        vacancies.map((vacancy) =>
          isOwner ? (
            <ClubVacancyOwnerRow
              key={vacancy.id}
              clubId={clubId}
              vacancy={vacancy}
              unansweredCount={unansweredFor(vacancy.id)}
            />
          ) : (
            <OpportunityListCard key={vacancy.id} {...vacancy} />
          ),
        )
      )}
    </div>
  );
}
