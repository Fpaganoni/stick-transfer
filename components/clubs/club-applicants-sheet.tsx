"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { FileText } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useJobApplicants, useUpdateApplicationStatus } from "@/hooks/useClubVacancies";
import { mayBeTruncated } from "@/lib/club-page-limit";
import { formatRelativeTime } from "@/lib/date-utils";
import { toSafeLinkUrl } from "@/lib/social-links";
import type { ApplicationStatus, JobApplication } from "@/types/models/job-application";

type ReviewStatus = "UNDER_REVIEW" | "ACCEPTED" | "REJECTED";

/** Actions the club can take, with the translation key of their button. */
const REVIEW_ACTIONS: ReadonlyArray<{ status: ReviewStatus; labelKey: string }> = [
  { status: "UNDER_REVIEW", labelKey: "markUnderReview" },
  { status: "ACCEPTED", labelKey: "accept" },
  { status: "REJECTED", labelKey: "reject" },
];

const STATUS_BADGE: Record<ApplicationStatus, string> = {
  PENDING: "bg-warning/20 text-warning border-warning/30",
  UNDER_REVIEW: "bg-info/20 text-info border-info/30",
  ACCEPTED: "bg-accent/20 text-foreground border-accent/30",
  REJECTED: "bg-error/20 text-error border-error/30",
  WITHDRAWN: "bg-border text-foreground-muted border-border",
};

interface ClubApplicantsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubId: string;
  jobId: string;
  jobTitle: string;
}

interface ApplicantRowProps {
  application: JobApplication;
  clubId: string;
  jobId: string;
}

function ApplicantRow({ application, clubId, jobId }: ApplicantRowProps) {
  const t = useTranslations("clubProfile.vacancies");
  const locale = useLocale() as "en" | "es" | "fr";
  const review = useUpdateApplicationStatus();

  const name = application.user?.name ?? "";
  const username = application.user?.username;
  const resumeUrl = toSafeLinkUrl(application.resumeUrl);
  // The applicant can withdraw at any time; a withdrawn application cannot be reviewed
  const canReview = application.status !== "WITHDRAWN";

  return (
    <li aria-label={name} className="rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Avatar className="size-10 shrink-0">
          <AvatarImage src={application.user?.avatar} alt="" />
          <AvatarFallback>{Array.from(name.trim())[0]?.toUpperCase() ?? "?"}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          {username ? (
            <Link
              href={`/profile/${username}`}
              className="font-semibold text-foreground hover:underline truncate block"
            >
              {name}
            </Link>
          ) : (
            <p className="font-semibold text-foreground truncate">{name}</p>
          )}
          <p className="text-xs text-foreground-muted">
            {formatRelativeTime(application.appliedAt, locale)}
          </p>
        </div>
        <Badge className={`text-xs py-0 px-1.5 ${STATUS_BADGE[application.status]}`}>
          {t(`applicationStatus.${application.status}`)}
        </Badge>
      </div>

      {application.coverLetter && (
        <div>
          <p className="text-xs font-medium text-foreground-muted">{t("coverLetter")}</p>
          {/* Plain text: the applicant wrote it */}
          <p className="text-sm text-foreground whitespace-pre-line wrap-break-word">
            {application.coverLetter}
          </p>
        </div>
      )}

      {resumeUrl && (
        <a
          href={resumeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <FileText aria-hidden size={16} />
          {t("resume")}
        </a>
      )}

      {canReview && (
        <div className="flex flex-wrap gap-2">
          {REVIEW_ACTIONS.map(({ status, labelKey }) => (
            <button
              key={status}
              type="button"
              disabled={application.status === status || review.isPending}
              onClick={() =>
                review.mutate({
                  applicationId: application.id,
                  jobOpportunityId: jobId,
                  clubId,
                  status,
                })
              }
              className="px-3 py-1.5 rounded-lg border border-border text-sm text-foreground hover:bg-surface-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      )}
    </li>
  );
}

/** Applicants of one vacancy, with the actions to answer each application. */
export function ClubApplicantsSheet({
  open,
  onOpenChange,
  clubId,
  jobId,
  jobTitle,
}: ClubApplicantsSheetProps) {
  const t = useTranslations("clubProfile.vacancies");
  // Nothing is requested until the owner opens the panel
  const { data: applicants = [], isLoading, isError } = useJobApplicants(open ? jobId : null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-4">
        <SheetHeader className="p-0">
          <SheetTitle>{t("applicantsTitle", { title: jobTitle })}</SheetTitle>
          <SheetDescription>{t("applicantsDescription")}</SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-24 rounded-xl bg-surface-elevated animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <p role="alert" className="text-sm text-error">
            {t("applicantsLoadError")}
          </p>
        ) : applicants.length === 0 ? (
          <p className="text-sm text-foreground-muted">{t("applicantsEmpty")}</p>
        ) : (
          <>
            {mayBeTruncated(applicants.length) && (
              <p role="status" className="text-xs text-foreground-muted">
                {t("applicantsLimitNotice")}
              </p>
            )}
            <ul className="space-y-3">
              {applicants.map((application) => (
                <ApplicantRow
                  key={application.id}
                  application={application}
                  clubId={clubId}
                  jobId={jobId}
                />
              ))}
            </ul>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
