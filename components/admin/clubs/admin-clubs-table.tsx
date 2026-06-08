"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { ShieldCheck } from "lucide-react";
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
import { AdminClubRow, ClubVerificationStatus } from "@/types/models/admin";

const STATUS_BADGE_CLASS: Record<ClubVerificationStatus, string> = {
  UNVERIFIED: "border-foreground-muted text-foreground-muted",
  PENDING: "border-warning text-warning",
  VERIFIED: "border-success text-success",
  REJECTED: "border-error text-error",
};

interface AdminClubsTableProps {
  clubs: AdminClubRow[];
  isLoading?: boolean;
  onReview: (club: AdminClubRow) => void;
}

export function AdminClubsTable({ clubs, isLoading, onReview }: AdminClubsTableProps) {
  const t = useTranslations("admin.clubs");
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

  if (clubs.length === 0) {
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
            <TableHead>{t("table.name")}</TableHead>
            <TableHead>{t("table.location")}</TableHead>
            <TableHead>{t("table.league")}</TableHead>
            <TableHead>{t("table.members")}</TableHead>
            <TableHead>{t("table.status")}</TableHead>
            <TableHead>{t("table.joined")}</TableHead>
            <TableHead className="text-right">{t("table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clubs.map((club) => (
            <TableRow
              key={club.id}
              className={club.verificationStatus === "PENDING" ? "bg-warning/5" : undefined}
            >
              <TableCell>
                <Link href={`/clubs/${club.id}`} className="flex items-center gap-3 hover:underline">
                  <Avatar className="size-8">
                    <AvatarImage src={club.logo} alt={club.name} />
                    <AvatarFallback>{club.name?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{club.name}</span>
                </Link>
              </TableCell>
              <TableCell className="text-foreground-muted">
                {[club.city, club.country].filter(Boolean).join(", ") || "—"}
              </TableCell>
              <TableCell className="text-foreground-muted">{club.league || "—"}</TableCell>
              <TableCell className="text-foreground-muted">{club.membersCount}</TableCell>
              <TableCell>
                <Badge variant="outline" className={STATUS_BADGE_CLASS[club.verificationStatus]}>
                  {t(`verificationStatus.${club.verificationStatus}`)}
                </Badge>
              </TableCell>
              <TableCell className="text-foreground-muted">{formatDate(club.createdAt, locale)}</TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" onClick={() => onReview(club)}>
                  <ShieldCheck className="size-4" />
                  {t("table.review")}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
