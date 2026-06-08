"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { useSuperAdminNews } from "@/hooks/useAdminNews";
import { NewsArticleForm } from "@/components/admin/news/news-article-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

export default function AdminEditArticlePage() {
  const t = useTranslations("admin.news");
  const params = useParams<{ id: string }>();
  const { data, isLoading } = useSuperAdminNews(undefined, 1, 100);
  const article = data?.superAdminNewsArticles.items.find((item) => item.id === params.id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  if (!article) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertCircle className="size-6" />
          </EmptyMedia>
          <EmptyTitle>{t("notFoundTitle")}</EmptyTitle>
          <EmptyDescription>{t("notFoundDescription")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("editArticleTitle")}</h1>
        <p className="text-sm text-foreground-muted">{article.title}</p>
      </div>

      <NewsArticleForm mode="edit" article={article} />
    </div>
  );
}
