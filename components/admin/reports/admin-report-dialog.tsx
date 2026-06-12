"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useUpdateReportStatus } from "@/hooks/useReports";
import { formatDate } from "@/lib/date-utils";
import { Report, ReportStatus, ReportTargetType } from "@/types/models/report";

const STATUS_BADGE_CLASS: Record<ReportStatus, string> = {
  PENDING: "border-warning text-warning",
  REVIEWED: "border-info text-info",
  ACTION_TAKEN: "border-success text-success",
  DISMISSED: "border-foreground-muted text-foreground-muted",
};

const TARGET_HREF: Partial<Record<ReportTargetType, (id: string) => string>> = {
  USER: (id) => `/profile/${id}`,
  CLUB: (id) => `/clubs/${id}`,
};

interface AdminReportDialogProps {
  report: Report | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminReportDialog({ report, open, onOpenChange }: AdminReportDialogProps) {
  const t = useTranslations("admin.reports.dialog");
  const locale = useLocale() as "en" | "es" | "fr";
  const updateStatus = useUpdateReportStatus();

  if (!report) return null;

  const targetHref = TARGET_HREF[report.targetType]?.(report.targetId);

  const handleStatus = (status: ReportStatus) => {
    updateStatus.mutate({ id: report.id, status });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("reportedOn")} {formatDate(report.createdAt, locale)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarImage src={report.reporter.avatar} alt={report.reporter.name} />
              <AvatarFallback>{report.reporter.name?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs text-foreground-muted">{t("reporter")}</p>
              <Link href={`/profile/${report.reporter.id}`} className="font-medium hover:underline">
                {report.reporter.name}
              </Link>
            </div>
            <Badge variant="outline" className={`ml-auto ${STATUS_BADGE_CLASS[report.status]}`}>
              {report.status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-foreground-muted">{t("target")}</p>
              <p className="font-medium">
                {report.targetType}
                {targetHref ? (
                  <Link href={targetHref} className="ml-2 text-primary hover:underline">
                    {t("viewTarget")}
                  </Link>
                ) : (
                  <span className="ml-2 text-foreground-muted">{report.targetId}</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-foreground-muted">{t("reason")}</p>
              <p className="font-medium">{report.reason}</p>
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs text-foreground-muted">{t("description")}</p>
            <p className="rounded-lg border border-border p-3 text-sm">
              {report.description || t("noDescription")}
            </p>
          </div>

          {report.reviewedBy && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-foreground-muted">{t("reviewedBy")}</p>
                <p className="font-medium">{report.reviewedBy.name}</p>
              </div>
              {report.reviewedAt && (
                <div>
                  <p className="text-xs text-foreground-muted">{t("reviewedAt")}</p>
                  <p className="font-medium">{formatDate(report.reviewedAt, locale)}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-wrap gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => handleStatus("DISMISSED")}
            disabled={report.status === "DISMISSED"}
          >
            {t("dismiss")}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleStatus("REVIEWED")}
            disabled={report.status === "REVIEWED"}
          >
            {t("markReviewed")}
          </Button>
          <Button
            onClick={() => handleStatus("ACTION_TAKEN")}
            disabled={report.status === "ACTION_TAKEN"}
          >
            {t("markActionTaken")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
