"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useReports } from "@/hooks/useReports";
import { AdminReportsTable } from "@/components/admin/reports/admin-reports-table";
import { AdminReportDialog } from "@/components/admin/reports/admin-report-dialog";
import { AdminPagination } from "@/components/admin/admin-pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Report, ReportStatus, ReportTargetType } from "@/types/models/report";

const PAGE_SIZE = 20;

const STATUS_FILTER_VALUES: (ReportStatus | "ALL")[] = [
  "ALL",
  "PENDING",
  "REVIEWED",
  "ACTION_TAKEN",
  "DISMISSED",
];

const TARGET_TYPE_FILTER_VALUES: (ReportTargetType | "ALL")[] = [
  "ALL",
  "USER",
  "CLUB",
  "POST",
  "JOB_OPPORTUNITY",
  "MESSAGE",
  "NEWS_ARTICLE",
];

export default function AdminReportsPage() {
  const t = useTranslations("admin.reports");
  const [status, setStatus] = useState<ReportStatus | "ALL">("ALL");
  const [targetType, setTargetType] = useState<ReportTargetType | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filters = {
    ...(status !== "ALL" ? { status } : {}),
    ...(targetType !== "ALL" ? { targetType } : {}),
  };

  const { data, isLoading } = useReports(filters, page, PAGE_SIZE);
  const items = data?.reports ?? [];
  // Backend `reports` returns a flat array (no total/hasMore). Approximate a
  // page count for AdminPagination: assume another page exists if this page
  // came back full.
  const total = (page - 1) * PAGE_SIZE + items.length + (items.length === PAGE_SIZE ? 1 : 0);

  const openReport = (report: Report) => {
    setSelectedReport(report);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-foreground-muted">{t("subtitle")}</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:flex-wrap">
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as ReportStatus | "ALL");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder={t("filters.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("filters.allStatuses")}</SelectItem>
              {STATUS_FILTER_VALUES.filter((s) => s !== "ALL").map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`status.${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={targetType}
            onValueChange={(value) => {
              setTargetType(value as ReportTargetType | "ALL");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder={t("filters.targetType")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("filters.allTargetTypes")}</SelectItem>
              {TARGET_TYPE_FILTER_VALUES.filter((tt) => tt !== "ALL").map((tt) => (
                <SelectItem key={tt} value={tt}>
                  {t(`targetTypes.${tt}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <AdminReportsTable reports={items} isLoading={isLoading} onView={openReport} />

      <AdminPagination page={page} total={total} limit={PAGE_SIZE} onPageChange={setPage} />

      <AdminReportDialog report={selectedReport} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
