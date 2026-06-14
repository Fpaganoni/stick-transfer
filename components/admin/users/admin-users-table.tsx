"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { CheckCircle2, XCircle } from "lucide-react";
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
import { useLocale } from "next-intl";
import { AdminUserRow } from "@/types/models/admin";
import { AdminUserRowActions } from "./admin-user-row-actions";

const ROLE_BADGE_VARIANT: Record<string, "player" | "club" | "coach" | "outline"> = {
  PLAYER: "player",
  COACH: "coach",
  CLUB: "club",
  SUPERADMIN: "outline",
};

interface AdminUsersTableProps {
  users: AdminUserRow[];
  isLoading?: boolean;
}

export function AdminUsersTable({ users, isLoading }: AdminUsersTableProps) {
  const t = useTranslations("admin.users");
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

  if (users.length === 0) {
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
            <TableHead>{t("table.email")}</TableHead>
            <TableHead>{t("table.role")}</TableHead>
            <TableHead>{t("table.location")}</TableHead>
            <TableHead>{t("table.status")}</TableHead>
            <TableHead>{t("table.verified")}</TableHead>
            <TableHead>{t("table.joined")}</TableHead>
            <TableHead className="text-right">{t("table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <Link href={`/profile/${user.id}`} className="flex items-center gap-3 hover:underline">
                  <Avatar className="size-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs text-foreground-muted">@{user.username}</span>
                  </div>
                </Link>
              </TableCell>
              <TableCell className="text-foreground-muted">{user.email}</TableCell>
              <TableCell>
                <Badge variant={ROLE_BADGE_VARIANT[user.role as string] ?? "outline"}>
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell className="text-foreground-muted">
                {[user.city, user.country].filter(Boolean).join(", ") || "—"}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={user.isActive ? "border-success text-success" : "border-error text-error"}>
                  {user.isActive ? t("status.active") : t("status.inactive")}
                </Badge>
              </TableCell>
              <TableCell>
                {user.isVerified ? (
                  <CheckCircle2 className="size-4 text-success" />
                ) : (
                  <XCircle className="size-4 text-foreground-muted" />
                )}
              </TableCell>
              <TableCell className="text-foreground-muted">{formatDate(user.createdAt, locale)}</TableCell>
              <TableCell className="text-right">
                <AdminUserRowActions user={user} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
