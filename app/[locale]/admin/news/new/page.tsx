"use client";

import { useTranslations } from "next-intl";
import { NewsArticleForm } from "@/components/admin/news/news-article-form";

export default function AdminNewArticlePage() {
  const t = useTranslations("admin.news");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("newArticleTitle")}</h1>
        <p className="text-sm text-foreground-muted">{t("newArticleSubtitle")}</p>
      </div>

      <NewsArticleForm mode="create" />
    </div>
  );
}
