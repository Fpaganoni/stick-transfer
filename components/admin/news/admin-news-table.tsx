"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Pencil, Eye, EyeOff, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDate } from "@/lib/date-utils";
import { NewsStatusBadge } from "./news-status-badge";
import {
  useDeleteNewsArticle,
  usePublishNewsArticle,
  useUnpublishNewsArticle,
} from "@/hooks/useAdminNews";
import { AdminNewsArticle } from "@/types/models/admin";

const CATEGORY_BADGE_CLASS: Record<string, string> = {
  INTERNATIONAL: "border-info text-info",
  NATIONAL: "border-accent text-accent",
  TRANSFERS: "border-primary text-primary",
  EQUIPMENT: "border-warning text-warning",
  RESULTS: "border-success text-success",
};

interface AdminNewsTableProps {
  articles: AdminNewsArticle[];
  isLoading?: boolean;
  localePrefix: string;
}

type PendingDelete = AdminNewsArticle | null;

export function AdminNewsTable({ articles, isLoading, localePrefix }: AdminNewsTableProps) {
  const t = useTranslations("admin.news");
  const locale = useLocale() as "en" | "es" | "fr";
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);

  const publish = usePublishNewsArticle();
  const unpublish = useUnpublishNewsArticle();
  const deleteArticle = useDeleteNewsArticle();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <Empty>
        <EmptyTitle>{t("table.empty")}</EmptyTitle>
        <EmptyDescription>{t("table.emptyDescription")}</EmptyDescription>
      </Empty>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.article")}</TableHead>
              <TableHead>{t("table.category")}</TableHead>
              <TableHead>{t("table.status")}</TableHead>
              <TableHead>{t("table.publishedAt")}</TableHead>
              <TableHead>{t("table.author")}</TableHead>
              <TableHead className="text-right">{t("table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.map((article) => (
              <TableRow key={article.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                      {article.coverImage ? (
                        <Image src={article.coverImage} alt={article.title} fill className="object-cover" />
                      ) : null}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{article.title}</span>
                      <span className="text-xs text-foreground-muted">/{article.slug}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={CATEGORY_BADGE_CLASS[article.category] ?? ""}>
                    {t(`categories.${article.category}`)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <NewsStatusBadge isPublished={article.isPublished} />
                </TableCell>
                <TableCell className="text-foreground-muted">
                  {article.publishedAt ? formatDate(article.publishedAt, locale) : "—"}
                </TableCell>
                <TableCell className="text-foreground-muted">{article.authorName || "—"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="size-8" asChild>
                      <Link href={`${localePrefix}/admin/news/${article.id}/edit`}>
                        <Pencil className="size-4" />
                        <span className="sr-only">{t("actions.edit")}</span>
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() =>
                        article.isPublished
                          ? unpublish.mutate({ id: article.id })
                          : publish.mutate({ id: article.id })
                      }
                    >
                      {article.isPublished ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      <span className="sr-only">
                        {article.isPublished ? t("actions.unpublish") : t("actions.publish")}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-error hover:text-error"
                      onClick={() => setPendingDelete(article)}
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">{t("actions.delete")}</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmDeleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmDeleteDescription", { title: pendingDelete?.title ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-error text-white hover:bg-error/90"
              onClick={() => {
                if (pendingDelete) deleteArticle.mutate({ id: pendingDelete.id });
                setPendingDelete(null);
              }}
            >
              {t("actions.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
