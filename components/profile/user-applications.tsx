"use client";

import { useMemo } from "react";
import { useUserApplications } from "@/hooks/useJobApplications";
import { useJobOpportunities } from "@/hooks/useJobOpportunities";
import { useTranslations, useLocale } from "next-intl";
import { formatRelativeTime } from "@/lib/date-utils";
import { Loader2, MapPin, Award, Calendar, CheckCircle, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export function UserApplications() {
  const t = useTranslations("profile");
  const locale = useLocale() as "en" | "es" | "fr";
  const { applications, isLoading: isLoadingApplications } = useUserApplications();
  const { data: opportunitiesData, isLoading: isLoadingOpportunities } = useJobOpportunities();

  const applicationsWithDetails = useMemo(() => {
    if (!opportunitiesData?.jobOpportunities || !applications.length) return [];

    const opportunitiesMap = new Map(
      opportunitiesData.jobOpportunities.map((opp) => [opp.id, opp])
    );

    return applications
      .map((app) => ({
        ...app,
        opportunity: opportunitiesMap.get(app.jobOpportunityId),
      }))
      .filter((app) => app.opportunity);
  }, [applications, opportunitiesData]);

  const getStatusColor = (status: string) => {
    const normalized = status.toLowerCase();
    switch (normalized) {
      case "accepted":
        return "bg-success/30 text-foreground border-success/40";
      case "rejected":
        return "bg-error/30 text-foreground border-error/40";
      case "pending":
        return "bg-warning/30 text-foreground border-warning/40";
      default:
        return "bg-info/30 text-foreground border-info/40";
    }
  };

  const getStatusIcon = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === "accepted") return <CheckCircle size={16} />;
    if (normalized === "rejected") return <XCircle size={16} />;
    return <Clock size={16} />;
  };

  if (isLoadingApplications || isLoadingOpportunities) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (applicationsWithDetails.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full py-12 text-center border-2 border-dashed border-border rounded-xl"
      >
        <Calendar className="mx-auto mb-3 text-foreground-muted" size={32} />
        <p className="text-foreground-muted font-medium">
          {t("applications.noApplications")}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {applicationsWithDetails.map((app, idx) => {
        const { opportunity } = app;
        return (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="bg-background rounded-xl overflow-hidden border border-border hover:shadow-lg transition-all duration-200 group"
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {opportunity?.title}
                  </h3>
                  <p className="text-foreground-muted font-medium">
                    {opportunity?.club.name}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  <Badge className={getStatusColor(app.status)}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(app.status)}
                      {app.status}
                    </span>
                  </Badge>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4 py-4 border-t border-b border-border">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-accent" />
                  <div>
                    <p className="text-xs text-foreground-muted uppercase tracking-wide">
                      {t("applications.location")}
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {opportunity?.city}, {opportunity?.country}
                    </p>
                  </div>
                </div>

                {opportunity?.salary && (
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
                )}

                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-accent" />
                  <div>
                    <p className="text-xs text-foreground-muted uppercase tracking-wide">
                      {t("applications.appliedAt")}
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {formatRelativeTime(app.appliedAt, locale)}
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

              {/* Description Preview */}
              {opportunity?.description && (
                <p className="text-sm text-foreground-muted line-clamp-2">
                  {opportunity.description}
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
