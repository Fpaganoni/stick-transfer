"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Trash2, Users } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ClubApplicantsSheet } from "@/components/clubs/club-applicants-sheet";
import { OpportunityListCard } from "@/components/opportunities/opportunity-list-card";
import { useDeleteVacancy, useUpdateVacancyStatus } from "@/hooks/useClubVacancies";
import { getJobDeletionState } from "@/lib/job-deletion-rules";
import type { JobOpportunity, JobStatus } from "@/types/models/job-opportunity";

const STATUS_BADGE: Record<JobStatus, string> = {
  OPEN: "bg-accent/20 text-foreground border-accent/30",
  CLOSED: "bg-border text-foreground-muted border-border",
  FILLED: "bg-info/20 text-info border-info/30",
};

const actionButton =
  "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-sm text-foreground hover:bg-surface-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

interface ClubVacancyOwnerRowProps {
  clubId: string;
  vacancy: JobOpportunity;
  /** Applications still PENDING or UNDER_REVIEW; null while they are unknown. */
  unansweredCount: number | null;
  /** Reopening is publishing: only a verified club may do it. */
  canReopen: boolean;
}

/** One vacancy as its owner sees it: the card plus close, fill, delete and applicants. */
export function ClubVacancyOwnerRow({
  clubId,
  vacancy,
  unansweredCount,
  canReopen,
}: ClubVacancyOwnerRowProps) {
  const t = useTranslations("clubProfile.vacancies");
  const locale = useLocale();
  const updateStatus = useUpdateVacancyStatus();
  const deleteVacancy = useDeleteVacancy();
  const [isApplicantsOpen, setIsApplicantsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Older caches hold the status in lower case
  const status = vacancy.status.toUpperCase() as JobStatus;
  const deletion = getJobDeletionState({
    status,
    filledAt: vacancy.filledAt,
    // Unknown counts are treated as "waiting": never offer a delete we cannot vouch for
    unansweredCount: unansweredCount ?? 1,
  });
  const hintId = `delete-hint-${vacancy.id}`;
  const reopenHintId = `reopen-hint-${vacancy.id}`;

  const changeStatus = (next: JobStatus) =>
    updateStatus.mutate({ id: vacancy.id, clubId, status: next });

  const deleteHint = deletion.canDelete
    ? null
    : deletion.reason === "FILLED_COOLDOWN"
      ? t("deleteAvailableOn", {
          date: new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(deletion.availableAt),
        })
      : unansweredCount === null
        ? t("deleteCountsUnavailable")
        : t("deleteBlockedUnanswered");

  return (
    <div className="space-y-2">
      <OpportunityListCard {...vacancy} />

      <div className="flex flex-wrap items-center gap-2 px-1">
        <Badge className={`text-xs py-0 px-1.5 ${STATUS_BADGE[status]}`}>
          {t(`status.${status}`)}
        </Badge>

        <button type="button" className={actionButton} onClick={() => setIsApplicantsOpen(true)}>
          <Users aria-hidden size={16} />
          {t("applicants")}
          {unansweredCount !== null && unansweredCount > 0 && (
            <span className="min-w-5 px-1.5 rounded-full bg-primary text-white-black text-xs font-semibold text-center">
              {unansweredCount}
            </span>
          )}
        </button>

        {status === "OPEN" && (
          <button
            type="button"
            className={actionButton}
            disabled={updateStatus.isPending}
            onClick={() => changeStatus("CLOSED")}
          >
            {t("close")}
          </button>
        )}
        {status !== "OPEN" && (
          <button
            type="button"
            className={actionButton}
            disabled={updateStatus.isPending || !canReopen}
            aria-describedby={canReopen ? undefined : reopenHintId}
            onClick={() => changeStatus("OPEN")}
          >
            {t("reopen")}
          </button>
        )}
        {status !== "FILLED" && (
          <button
            type="button"
            className={actionButton}
            disabled={updateStatus.isPending}
            onClick={() => changeStatus("FILLED")}
          >
            {t("markFilled")}
          </button>
        )}

        <button
          type="button"
          className={`${actionButton} text-error`}
          disabled={!deletion.canDelete || deleteVacancy.isPending}
          aria-describedby={deleteHint ? hintId : undefined}
          onClick={() => setIsDeleteOpen(true)}
        >
          <Trash2 aria-hidden size={16} />
          {t("delete")}
        </button>
      </div>

      {status !== "OPEN" && !canReopen && (
        <p id={reopenHintId} className="px-1 text-xs text-foreground-muted">
          {t("reopenNeedsVerification")}
        </p>
      )}

      {deleteHint && (
        <p id={hintId} className="px-1 text-xs text-foreground-muted">
          {deleteHint}
        </p>
      )}

      <ClubApplicantsSheet
        open={isApplicantsOpen}
        onOpenChange={setIsApplicantsOpen}
        clubId={clubId}
        jobId={vacancy.id}
        jobTitle={vacancy.title}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteVacancy.mutate({ id: vacancy.id, clubId })}
            >
              {t("confirmDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
