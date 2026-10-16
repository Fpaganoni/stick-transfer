"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Briefcase, Plus } from "lucide-react";
import { ClubVacancyOwnerRow } from "@/components/clubs/club-vacancy-owner-row";
import { OpportunityListCard } from "@/components/opportunities/opportunity-list-card";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useClubVacancies, useUnansweredApplicationCounts } from "@/hooks/useClubVacancies";

const publishButton =
  "inline-flex items-center gap-2 px-4 py-2 bg-primary text-white-black font-semibold rounded-lg hover:bg-primary-hover transition-colors text-sm";

interface ClubVacanciesTabProps {
  clubId: string;
  mode: "owner" | "public";
  /** Only a verified club publishes or reopens vacancies; ignored in public mode. */
  canPublish: boolean;
}

/**
 * Visitors see the OPEN vacancies of the club. The owner sees all of them,
 * whatever their status, and can publish a new one.
 */
export function ClubVacanciesTab({ clubId, mode, canPublish }: ClubVacanciesTabProps) {
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
        <div className="flex flex-col items-end gap-1">
          {canPublish ? (
            <Link href="/opportunities/new" className={publishButton}>
              <Plus aria-hidden size={16} />
              {t("publish")}
            </Link>
          ) : (
            <>
              <button
                type="button"
                disabled
                aria-describedby="publish-needs-verification"
                className={`${publishButton} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Plus aria-hidden size={16} />
                {t("publish")}
              </button>
              <p id="publish-needs-verification" className="text-xs text-foreground-muted">
                {t("publishNeedsVerification")}
              </p>
            </>
          )}
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
              canReopen={canPublish}
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
