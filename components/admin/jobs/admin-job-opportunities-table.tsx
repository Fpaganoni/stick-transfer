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
import { formatDate } from "@/lib/date-utils";
import { AdminJobOpportunityRow } from "@/types/models/admin";

const STATUS_BADGE_CLASS: Record<string, string> = {
  OPEN: "border-success text-success",
  CLOSED: "border-foreground-muted text-foreground-muted",
  FILLED: "border-info text-info",
};

const KNOWN_STATUSES = ["OPEN", "CLOSED", "FILLED"];

interface AdminJobOpportunitiesTableProps {
  opportunities: AdminJobOpportunityRow[];
  isLoading?: boolean;
}

export function AdminJobOpportunitiesTable({ opportunities, isLoading }: AdminJobOpportunitiesTableProps) {
  const t = useTranslations("admin.jobs");
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

  if (opportunities.length === 0) {
    return (
      <Empty>
        <EmptyTitle>{t("opportunities.table.empty")}</EmptyTitle>
        <EmptyDescription>{t("opportunities.table.emptyDescription")}</EmptyDescription>
      </Empty>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("opportunities.table.title")}</TableHead>
            <TableHead>{t("opportunities.table.club")}</TableHead>
            <TableHead>{t("opportunities.table.position")}</TableHead>
            <TableHead>{t("opportunities.table.location")}</TableHead>
            <TableHead>{t("opportunities.table.status")}</TableHead>
            <TableHead>{t("opportunities.table.applications")}</TableHead>
            <TableHead>{t("opportunities.table.expires")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {opportunities.map((job) => {
            const status = job.status?.toUpperCase?.() ?? job.status;
            return (
              <TableRow key={job.id}>
                <TableCell className="font-medium">{job.title}</TableCell>
                <TableCell>
                  <Link href={`/clubs/${job.club.id}`} className="flex items-center gap-2 hover:underline">
                    <Avatar className="size-7">
                      <AvatarImage src={job.club.logo} alt={job.club.name} />
                      <AvatarFallback>{job.club.name?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span>{job.club.name}</span>
                  </Link>
                </TableCell>
                <TableCell className="text-foreground-muted">
                  {job.positionType}
                  {job.level ? ` · ${job.level}` : ""}
                </TableCell>
                <TableCell className="text-foreground-muted">
                  {[job.city, job.country].filter(Boolean).join(", ") || "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={STATUS_BADGE_CLASS[status] ?? ""}>
                    {KNOWN_STATUSES.includes(status) ? t(`opportunities.status.${status}`) : status}
                  </Badge>
                </TableCell>
                <TableCell className="text-foreground-muted">{job.applicationsCount}</TableCell>
                <TableCell className="text-foreground-muted">
                  {job.expiresAt ? formatDate(job.expiresAt, locale) : "—"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
