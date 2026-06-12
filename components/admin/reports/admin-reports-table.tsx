"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
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

interface AdminReportsTableProps {
  reports: Report[];
  isLoading?: boolean;
  onView: (report: Report) => void;
}

export function AdminReportsTable({ reports, isLoading, onView }: AdminReportsTableProps) {
  const t = useTranslations("admin.reports");
  const locale = useLocale() as "en" | "es" | "fr";

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <Empty>
        <EmptyTitle>{t("table.empty")}</EmptyTitle>
        <EmptyDescription>{t("table.emptyDescription")}</EmptyDescription>
      </Empty>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("table.reporter")}</TableHead>
            <TableHead>{t("table.target")}</TableHead>
            <TableHead>{t("table.reason")}</TableHead>
            <TableHead>{t("table.status")}</TableHead>
            <TableHead>{t("table.date")}</TableHead>
            <TableHead className="text-right">{t("table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => {
            const targetHref = TARGET_HREF[report.targetType]?.(report.targetId);
            return (
              <TableRow
                key={report.id}
                className={report.status === "PENDING" ? "bg-warning/5" : undefined}
              >
                <TableCell>
                  <Link
                    href={`/profile/${report.reporter.id}`}
                    className="flex items-center gap-2 hover:underline"
                  >
                    <Avatar className="size-7">
                      <AvatarImage src={report.reporter.avatar} alt={report.reporter.name} />
                      <AvatarFallback>{report.reporter.name?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span>{report.reporter.name}</span>
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm">{t(`targetTypes.${report.targetType}`)}</span>
                    {targetHref ? (
                      <Link
                        href={targetHref}
                        className="text-xs text-foreground-muted hover:underline"
                      >
                        {report.targetId}
                      </Link>
                    ) : (
                      <span className="text-xs text-foreground-muted">{report.targetId}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-foreground-muted">
                  {t(`reasons.${report.reason}`)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={STATUS_BADGE_CLASS[report.status]}>
                    {t(`status.${report.status}`)}
                  </Badge>
                </TableCell>
                <TableCell className="text-foreground-muted">
                  {formatDate(report.createdAt, locale)}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => onView(report)}>
                    {t("table.view")}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
