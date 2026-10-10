"use client";

import { useUserApplications } from "@/hooks/useJobApplications";
import { useOpenOpportunityDetail } from "@/hooks/useJobOpportunities";
import { useTranslations, useLocale } from "next-intl";
import { formatRelativeTime } from "@/lib/date-utils";
import { MapPin, Award, Calendar, CheckCircle, Clock, XCircle, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CountryLabel } from "@/components/ui/country-label";
import { OpportunityDetailModal } from "@/components/opportunities/opportunity-detail-modal";
import type { ApplicationStatus, UserApplication } from "@/types/models/job-application";

const KNOWN_STATUSES: ApplicationStatus[] = [
  "PENDING",
  "UNDER_REVIEW",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
];

const LOADING_PLACEHOLDERS = 3;

function getStatusColor(status: ApplicationStatus) {
  switch (status) {
    case "ACCEPTED":
      return "bg-success/30 text-foreground border-success/40";
    case "REJECTED":
      return "bg-error/30 text-foreground border-error/40";
    case "PENDING":
      return "bg-warning/30 text-foreground border-warning/40";
    case "WITHDRAWN":
      return "bg-foreground/10 text-foreground-muted border-border";
    default:
      return "bg-info/30 text-foreground border-info/40";
  }
}

function getStatusIcon(status: ApplicationStatus) {
  if (status === "ACCEPTED") return <CheckCircle size={16} />;
  if (status === "REJECTED") return <XCircle size={16} />;
  if (status === "WITHDRAWN") return <Undo2 size={16} />;
  return <Clock size={16} />;
}

function ApplicationsSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label={label}>
      {Array.from({ length: LOADING_PLACEHOLDERS }, (_, idx) => (
        <div key={idx} className="bg-background rounded-xl border border-border p-4 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-16 w-full" />
        </div>
      ))}
    </div>
  );
}

interface ApplicationItemProps {
  application: UserApplication;
  onOpen: () => void;
}

function ApplicationItem({ application, onOpen }: ApplicationItemProps) {
  const t = useTranslations("profile");
  const locale = useLocale() as "en" | "es" | "fr";
  const opportunity = application.jobOpportunity;
  const isWithdrawn = application.status === "WITHDRAWN";
  const statusLabel = KNOWN_STATUSES.includes(application.status)
    ? t(`applications.status.${application.status}`)
    : application.status;

  return (
    <button
      type="button"
      onClick={onOpen}
      data-status={application.status}
      className={`w-full text-left bg-background rounded-xl overflow-hidden border border-border hover:shadow-lg transition duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        isWithdrawn ? "opacity-70" : ""
      }`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {opportunity?.title}
            </h3>
            <p className="text-foreground-muted font-medium">{opportunity?.club.name}</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <Badge className={getStatusColor(application.status)}>
              <span className="flex items-center gap-1">
                {getStatusIcon(application.status)}
                {statusLabel}
              </span>
            </Badge>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 py-4 border-t border-border">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-accent" />
            <div>
              <p className="text-xs text-foreground-muted uppercase tracking-wide">
                {t("applications.location")}
              </p>
              <p className="text-sm font-semibold text-foreground">
                <CountryLabel city={opportunity?.city} value={opportunity?.country} />
              </p>
            </div>
          </div>

          {opportunity?.salary ? (
            <div className="flex items-center gap-2">
              <Award size={16} className="text-accent" />
              <div>
                <p className="text-xs text-foreground-muted uppercase tracking-wide">
                  {t("applications.salary")}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {opportunity.salary} {opportunity.currency}
                </p>
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-accent" />
            <div>
              <p className="text-xs text-foreground-muted uppercase tracking-wide">
                {t("applications.appliedAt")}
              </p>
              <p className="text-sm font-semibold text-foreground">
                {formatRelativeTime(application.appliedAt, locale)}
              </p>
            </div>
          </div>

          {opportunity?.level && (
            <div className="flex items-center gap-2">
              <Badge className="bg-info/30 text-foreground border-info/40 text-xs">
                {opportunity.level}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export function UserApplications() {
  const t = useTranslations("profile");
  const { applications, isLoading } = useUserApplications();
  const openOpportunityDetail = useOpenOpportunityDetail();

  // The opportunity comes nested; a row without it has nothing to show or open
  const visibleApplications = applications.filter((app) => app.jobOpportunity);

  if (isLoading) {
    return <ApplicationsSkeleton label={t("applications.loading")} />;
  }

  if (visibleApplications.length === 0) {
    return (
      <div className="w-full py-12 text-center border-2 border-dashed border-border rounded-xl">
        <Calendar className="mx-auto mb-3 text-foreground-muted" size={32} />
        <p className="text-foreground-muted font-medium">
          {t("applications.noApplications")}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {visibleApplications.map((app) => (
          <ApplicationItem
            key={app.id}
            application={app}
            onOpen={() => app.jobOpportunity && openOpportunityDetail(app.jobOpportunity)}
          />
        ))}
      </div>
      <OpportunityDetailModal />
    </>
  );
}
