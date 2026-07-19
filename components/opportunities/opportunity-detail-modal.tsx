"use client";

import { useState } from "react";
import { JobOpportunity } from "@/types/models/job-opportunity";
import { useOpportunitiesStore } from "@/stores/useOpportunitiesStore";
import { useTranslations, useLocale } from "next-intl";
import { useAuthStore } from "@/stores/useAuthStore";
import { useApplyForJob, useUserApplications } from "@/hooks/useJobApplications";
import { useSavedJobsStore } from "@/stores/useSavedJobsStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

type OpportunityDetailModalProps = Pick<
  JobOpportunity,
  | "id"
  | "title"
  | "description"
  | "positionType"
  | "club"
  | "country"
  | "city"
  | "salary"
  | "currency"
  | "benefits"
  | "createdAt"
  | "level"
  | "status"
>;

export function OpportunityDetailModal() {
  const t = useTranslations("opportunities");
  const locale = useLocale() as "en" | "es" | "fr";
  const { selectedOpportunity, isModalOpen, closeModal } =
    useOpportunitiesStore();
  const { user } = useAuthStore();
  const { mutate: applyForJob, isPending } = useApplyForJob();
  const { hasAppliedTo, isLoading: isLoadingApplications } =
    useUserApplications();
  const { toggleSave, isSaved } = useSavedJobsStore();
  const [hasAppliedLocalState, setHasAppliedLocalState] = useState(false);

  if (!selectedOpportunity) {
    return null;
  }

  const opportunity = selectedOpportunity as OpportunityDetailModalProps;
  const normalizedStatus = opportunity.status.toLowerCase() as
    | "open"
    | "closed"
    | "filled";

  // Ensure benefits is always an array
  const benefitsArray: string[] = Array.isArray(opportunity.benefits)
    ? opportunity.benefits
    : typeof opportunity.benefits === "string"
      ? (opportunity.benefits as string).split(",").map((b: string) => b.trim())
      : [];

  const handleApply = () => {
    if (!user?.id) {
      console.error("User not authenticated");
      return;
    }

    applyForJob(
      {
        jobOpportunityId: opportunity.id,
        coverLetter: undefined,
        resumeUrl: user.cvUrl || undefined,
      },
      {
        onSuccess: () => {
          setHasAppliedLocalState(true);
        },
      }
    );
  };

  // Check if user already applied - either from previous query or local state
  const userAlreadyApplied =
    hasAppliedLocalState || hasAppliedTo(opportunity.id);

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="max-w-2xl max-h-[calc(100dvh-2rem)] grid-rows-[auto_1fr] p-0 gap-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-bold pr-6">
            {opportunity.title}
          </DialogTitle>
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
                  {opportunity.city}, {opportunity.country}
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
                  {opportunity.country}
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
                  {opportunity.positionType}
                </p>
              </div>
            </div>
          </div>

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

          {/* Benefits */}
          {benefitsArray.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground-muted uppercase tracking-wide mb-3">
                {t("benefits")}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {benefitsArray.map((benefit: string, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-success mt-0.5" />
                    <p className="text-sm text-foreground">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-border">
            {normalizedStatus === "filled" || userAlreadyApplied ? (
              <button
                disabled
                className="flex-1 py-2 rounded-lg border-2 border-success bg-success/20 font-semibold text-foreground flex items-center justify-center gap-2 transition-colors duration-300 cursor-default"
              >
                <CheckCircle size={18} />
                {t("applicationSent")}
              </button>
            ) : (
              <button
                onClick={handleApply}
                disabled={isPending || !user || isLoadingApplications}
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
              onClick={() => toggleSave(opportunity.id)}
              className={`px-4 py-2 rounded-lg border transition-colors duration-200 flex items-center gap-2 font-semibold ${
                isSaved(opportunity.id)
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-foreground/10 border-border text-foreground hover:bg-foreground/20"
              }`}
              aria-label="Bookmark"
            >
              <Bookmark
                size={18}
                fill={isSaved(opportunity.id) ? "currentColor" : "none"}
              />
            </button>
            <button
              onClick={closeModal}
              className="px-6 py-2 rounded-lg bg-foreground/10 hover:bg-foreground/20 text-foreground font-semibold transition-colors duration-300"
            >
              {t("close")}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
