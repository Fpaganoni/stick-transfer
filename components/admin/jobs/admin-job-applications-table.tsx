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
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/date-utils";
import { useAdminUpdateApplicationStatus } from "@/hooks/useAdminJobs";
import { AdminJobApplicationRow } from "@/types/models/admin";

const STATUS_BADGE_CLASS: Record<string, string> = {
  PENDING: "border-warning text-warning",
  UNDER_REVIEW: "border-info text-info",
  ACCEPTED: "border-success text-success",
  REJECTED: "border-error text-error",
  WITHDRAWN: "border-foreground-muted text-foreground-muted",
};

const APPLICATION_STATUSES = ["PENDING", "UNDER_REVIEW", "ACCEPTED", "REJECTED", "WITHDRAWN"];

interface AdminJobApplicationsTableProps {
  applications: AdminJobApplicationRow[];
  isLoading?: boolean;
}

export function AdminJobApplicationsTable({ applications, isLoading }: AdminJobApplicationsTableProps) {
  const t = useTranslations("admin.jobs");
  const locale = useLocale() as "en" | "es" | "fr";
  const updateStatus = useAdminUpdateApplicationStatus();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <Empty>
        <EmptyTitle>{t("applications.table.empty")}</EmptyTitle>
        <EmptyDescription>{t("applications.table.emptyDescription")}</EmptyDescription>
      </Empty>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("applications.table.applicant")}</TableHead>
            <TableHead>{t("applications.table.opportunity")}</TableHead>
            <TableHead>{t("applications.table.club")}</TableHead>
            <TableHead>{t("applications.table.status")}</TableHead>
            <TableHead>{t("applications.table.applied")}</TableHead>
            <TableHead className="text-right">{t("applications.table.changeStatus")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((application) => {
            const status = application.status?.toUpperCase?.() ?? application.status;
            return (
              <TableRow key={application.id}>
                <TableCell>
                  <Link
                    href={`/profile/${application.user.id}`}
                    className="flex items-center gap-2 hover:underline"
                  >
                    <Avatar className="size-7">
                      <AvatarImage src={application.user.avatar} alt={application.user.name} />
                      <AvatarFallback>{application.user.name?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{application.user.name}</span>
                  </Link>
                </TableCell>
                <TableCell className="text-foreground-muted">{application.jobOpportunity.title}</TableCell>
                <TableCell className="text-foreground-muted">{application.jobOpportunity.club.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={STATUS_BADGE_CLASS[status] ?? ""}>
                    {APPLICATION_STATUSES.includes(status)
                      ? t(`applications.status.${status}`)
                      : status}
                  </Badge>
                </TableCell>
                <TableCell className="text-foreground-muted">{formatDate(application.appliedAt, locale)}</TableCell>
                <TableCell className="text-right">
                  <Select
                    value={status}
                    onValueChange={(value) => {
                      if (value !== status) {
                        updateStatus.mutate({ id: application.id, status: value });
                      }
                    }}
                  >
                    <SelectTrigger className="ml-auto w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {APPLICATION_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {t(`applications.status.${s}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
