"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { formatDate } from "@/lib/date-utils";
import type { NewsArticleSummary, NewsCategory } from "@/hooks/useNews";

const categoryStyles: Record<NewsCategory, string> = {
  INTERNATIONAL: "bg-info/10 text-info",
  NATIONAL: "bg-accent/10 text-accent",
  TRANSFERS: "bg-error/10 text-error",
  EQUIPMENT: "bg-primary/10 text-primary",
  RESULTS: "bg-warning/10 text-warning",
};

interface NewsCardProps {
  article: NewsArticleSummary;
}

export function NewsCard({ article }: NewsCardProps) {
  const t = useTranslations("news");
  const locale = useLocale();

  const categoryKey = article.category.toLowerCase() as Lowercase<NewsCategory>;

  return (
    <Link href={`/${locale}/news/${article.slug}`} className="block group">
      <article className="bg-surface border border-border rounded-xl overflow-hidden hover:shadow-md hover:scale-[1.02] transition-all duration-200 h-full flex flex-col">
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        <div className="p-4 flex flex-col flex-1 gap-2">
          <span
            className={`self-start text-xs font-semibold px-2 py-0.5 rounded-full ${categoryStyles[article.category]}`}
          >
            {t(`categories.${categoryKey}`)}
          </span>

          <h3 className="font-semibold text-foreground line-clamp-2 leading-snug">
            {article.title}
          </h3>

          <p className="text-sm text-foreground-muted line-clamp-3 flex-1">
            {article.excerpt}
          </p>

          <div className="flex items-center gap-1 text-xs text-foreground-muted mt-auto pt-2 border-t border-border">
            <span>{formatDate(article.publishedAt, locale as "en" | "es" | "fr")}</span>
            <span>·</span>
            <span>
              {article.readingTimeMinutes} {t("card.minRead")}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
