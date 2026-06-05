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

interface NewsHeroCardProps {
  article: NewsArticleSummary;
}

export function NewsHeroCard({ article }: NewsHeroCardProps) {
  const t = useTranslations("news");
  const locale = useLocale();

  const categoryKey = article.category.toLowerCase() as Lowercase<NewsCategory>;

  return (
    <Link href={`/${locale}/news/${article.slug}`} className="block group">
      <article className="relative w-full rounded-xl overflow-hidden aspect-[16/7] md:aspect-[16/6]">
        <Image
          src={article.coverImage}
          alt={article.title}
          fill
          priority
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="100vw"
        />

        <div className="absolute inset-0 bg-linear-to-t from-foreground/80 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex flex-col gap-3">
          <span
            className={`self-start text-xs font-semibold px-2 py-0.5 rounded-full ${categoryStyles[article.category]}`}
          >
            {t(`categories.${categoryKey}`)}
          </span>

          <h2 className="text-white-black font-bold text-2xl md:text-3xl leading-tight line-clamp-2">
            {article.title}
          </h2>

          <p className="text-white-black/80 text-sm md:text-base line-clamp-2 max-w-2xl">
            {article.excerpt}
          </p>

          <div className="flex items-center gap-2 text-white-black/60 text-xs">
            <span>{article.author.name}</span>
            <span>·</span>
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
