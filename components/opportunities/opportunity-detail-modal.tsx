"use client";

import { JobOpportunity, isFullOpportunity } from "@/types/models/job-opportunity";
import { Skeleton } from "@/components/ui/skeleton";
import { useOpportunitiesStore } from "@/stores/useOpportunitiesStore";
import { useTranslations, useLocale } from "next-intl";
import { useAuthStore } from "@/stores/useAuthStore";
import { useApplyForJob, useUserApplications } from "@/hooks/useJobApplications";
import { useToggleSaveJob } from "@/hooks/useSavedJobs";
import { useUIStore } from "@/stores/useUIStore";
import { useRole } from "@/hooks/useRole";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  MapPin,
  Calendar,
  Award,
  Briefcase,
  Globe,
  CheckCircle,
  Loader,
  Bookmark,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/date-utils";
import { getPositionTypeLabel, isUmpireJob } from "@/lib/job-position-type";
import { UmpireJobDetails } from "./umpire-job-details";
import { CountryLabel } from "@/components/ui/country-label";

function getBenefitsArray(benefits: JobOpportunity["benefits"] | undefined): string[] {
  return Array.isArray(benefits) ? benefits : [];
}

interface OpportunityActionButtonsProps {
  t: (key: string) => string;
  normalizedStatus: "open" | "closed" | "filled";
  userAlreadyApplied: boolean;
  isPending: boolean;
  applyDisabled: boolean;
  isLoadingApplications: boolean;
  onApply: () => void;
  isSaved: boolean;
  saveDisabled: boolean;
  onToggleSave: () => void;
  onClose: () => void;
  canApply: boolean;
}

function OpportunityActionButtons({
  t,
  normalizedStatus,
  userAlreadyApplied,
  isPending,
  applyDisabled,
  isLoadingApplications,
  onApply,
  isSaved,
  saveDisabled,
  onToggleSave,
  onClose,
  canApply,
}: OpportunityActionButtonsProps) {
  return (
    <div className="flex gap-3 pt-4 border-t border-border">
      {!canApply ? null : normalizedStatus === "filled" || userAlreadyApplied ? (
        <button
          disabled
          className="flex-1 py-2 rounded-lg border-2 border-success bg-success/20 font-semibold text-foreground flex items-center justify-center gap-2 transition-colors duration-300 cursor-default"
        >
          <CheckCircle size={18} />
          {t("applicationSent")}
        </button>
      ) : (
        <button
          onClick={onApply}
          disabled={applyDisabled}
          className="flex-1 py-2 rounded-lg bg-success/20 border border-border hover:bg-success disabled:opacity-50 disabled:cursor-not-allowed text-foreground hover:text-background font-semibold transition-colors duration-300 cursor-pointer hover:shadow-lg flex items-center justify-center gap-2"
        >
          {isPending || isLoadingApplications ? (
            <>
              <Loader size={18} className="animate-spin" />
              {t("loading")}
            </>
          ) : (
            t("applyWithProfile")
          )}
        </button>
      )}
      <button
        onClick={onToggleSave}
        disabled={saveDisabled}
        className={`px-4 py-2 rounded-lg border transition-colors duration-200 flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
          isSaved
            ? "bg-primary/10 border-primary text-primary"
            : "bg-foreground/10 border-border text-foreground hover:bg-foreground/20"
        }`}
        aria-label="Bookmark"
        aria-pressed={isSaved}
      >
        <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
      </button>
      <button
        onClick={onClose}
        className="px-6 py-2 rounded-lg bg-foreground/10 hover:bg-foreground/20 text-foreground font-semibold transition-colors duration-300"
      >
        {t("close")}
      </button>
    </div>
  );
}

export function OpportunityDetailModal() {
  const t = useTranslations("opportunities");
  const locale = useLocale() as "en" | "es" | "fr";
  const { selectedOpportunity, isModalOpen, closeModal } =
    useOpportunitiesStore();
  const { user } = useAuthStore();
  const { isClub, isSuperAdmin, isUmpire } = useRole();
  const { mutate: applyForJob, isPending } = useApplyForJob();
  const { hasAppliedTo, isLoading: isLoadingApplications } =
    useUserApplications();
  const { mutate: toggleSave } = useToggleSaveJob();
  const { openLoginModal } = useUIStore();

  if (!selectedOpportunity) {
    return null;
  }

  const opportunity = selectedOpportunity;
  // Opened from the applications tab: the full opportunity is still loading
  const isPreview = !isFullOpportunity(opportunity);
  const normalizedStatus = opportunity.status.toLowerCase() as
    | "open"
    | "closed"
    | "filled";

  const benefitsArray = getBenefitsArray(opportunity.benefits);

  const isSaved = Boolean(selectedOpportunity.isSavedByCurrentUser);

  const handleToggleSave = () => {
    if (!user) {
      openLoginModal();
      return;
    }
    if (!isFullOpportunity(selectedOpportunity)) return;
    toggleSave({ job: selectedOpportunity, save: !isSaved });
  };

  // The backend rejects (403) anyone but umpires applying to UMPIRE opportunities.
  // Visitors still see the (disabled) button so they are prompted to sign in.
  const isUmpireOpportunity = isUmpireJob(opportunity.positionType);
  const canApply = isUmpireOpportunity
    ? isUmpire || !user
    : !isClub && !isSuperAdmin;
  const showUmpireOnlyNotice =
    isUmpireOpportunity && !!user && !isUmpire && !isClub && !isSuperAdmin;

  const handleApply = () => {
    if (!user?.id) {
      console.error("User not authenticated");
      return;
    }

    applyForJob({
      jobOpportunityId: opportunity.id,
      coverLetter: undefined,
      resumeUrl: user.cvUrl || undefined,
    });
  };

  // Derived from the opportunity on screen only: the modal stays mounted while
  // the store swaps opportunities, so no local "applied" state may survive.
  // userApplications is paged (50 by default); the backend flag covers the rest.
  const userAlreadyApplied =
    hasAppliedTo(opportunity.id) || Boolean(opportunity.hasAppliedByCurrentUser);

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="max-w-2xl max-h-[calc(100dvh-2rem)] grid-rows-[auto_1fr] p-0 gap-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-bold pr-6">
            {opportunity.title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Job opportunity details
          </DialogDescription>
        </DialogHeader>

        {/* Club and Status */}
        <div className="space-y-4 overflow-y-auto px-6 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-foreground">
                {opportunity.club.name}
              </p>
              {opportunity.club.isVerified && (
                <div className="flex items-center gap-1 mt-1">
                  <CheckCircle size={16} className="text-success" />
                  <span className="text-sm text-success font-medium">
                    {t("verified")}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
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
              <Badge className="bg-info/30 text-foreground border-info/40">
                {opportunity.level}
              </Badge>
            </div>
          </div>

          {/* Location Details */}
          <div className="grid grid-cols-2 gap-4 py-4 border-y border-border">
            <div className="flex items-center gap-3">
              <MapPin className="text-accent" size={20} />
              <div>
                <p className="text-xs text-foreground-muted uppercase tracking-wide">
                  {t("filters.location")}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  <CountryLabel city={opportunity.city} value={opportunity.country} />
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Globe className="text-accent" size={20} />
              <div>
                <p className="text-xs text-foreground-muted uppercase tracking-wide">
                  {t("country")}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  <CountryLabel value={opportunity.country} />
                </p>
              </div>
            </div>

            {opportunity.salary && (
              <div className="flex items-center gap-3">
                <Award className="text-accent" size={20} />
                <div>
                  <p className="text-xs text-foreground-muted uppercase tracking-wide">
                    {t("filters.salary")}
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {opportunity.salary} {opportunity.currency}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Briefcase className="text-accent" size={20} />
              <div>
                <p className="text-xs text-foreground-muted uppercase tracking-wide">
                  {t("positionType")}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {getPositionTypeLabel(t, opportunity.positionType)}
                </p>
              </div>
            </div>
          </div>

          {isPreview ? (
            <div aria-busy="true" aria-label={t("loadingDetails")} className="space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : (
            <>
              {/* Published Date */}
              <div className="flex items-center gap-2 text-foreground-muted">
                <Calendar size={18} />
                <span className="text-sm">
                  {t("published")} {formatRelativeTime(opportunity.createdAt, locale)}
                </span>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-foreground-muted uppercase tracking-wide mb-2">
                  {t("description")}
                </h3>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {opportunity.description}
                </p>
              </div>
            </>
          )}

          {isUmpireOpportunity && (
            <UmpireJobDetails opportunity={opportunity} variant="detail" />
          )}

          {/* Benefits */}
          {benefitsArray.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground-muted uppercase tracking-wide mb-3">
                {t("benefits")}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {benefitsArray.map((benefit: string) => (
                  <div key={benefit} className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-success mt-0.5" />
                    <p className="text-sm text-foreground">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <OpportunityActionButtons
            t={t}
            normalizedStatus={normalizedStatus}
            userAlreadyApplied={userAlreadyApplied}
            isPending={isPending}
            applyDisabled={isPending || !user || isLoadingApplications}
            isLoadingApplications={isLoadingApplications}
            onApply={handleApply}
            isSaved={isSaved}
            saveDisabled={isPreview}
            onToggleSave={handleToggleSave}
            onClose={closeModal}
            canApply={canApply}
          />
          {showUmpireOnlyNotice && (
            <p className="text-sm text-foreground-muted text-center">
              {t("umpireJob.onlyUmpires")}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
