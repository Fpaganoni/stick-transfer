"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Loader } from "lucide-react";
import { useNewsArticleQuery } from "@/hooks/useNews";
import type { NewsCategory } from "@/hooks/useNews";
import { formatDate } from "@/lib/date-utils";
import { NewsCard } from "@/components/news/news-card";

const categoryStyles: Record<NewsCategory, string> = {
  INTERNATIONAL: "bg-info/10 text-info",
  NATIONAL: "bg-accent/10 text-accent",
  TRANSFERS: "bg-error/10 text-error",
  EQUIPMENT: "bg-primary/10 text-primary",
  RESULTS: "bg-warning/10 text-warning",
};

interface NewsDetailPageProps {
  slug: string;
}

export function NewsDetailPage({ slug }: NewsDetailPageProps) {
  const t = useTranslations("news");
  const locale = useLocale();
  const { data, isLoading } = useNewsArticleQuery(slug);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const article = data?.newsArticle;
  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-foreground-muted">
        {t("empty")}
      </div>
    );
  }

  const categoryKey = article.category.toLowerCase() as Lowercase<NewsCategory>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
      <nav className="flex items-center gap-2 text-sm text-foreground-muted">
        <Link href={`/${locale}/news`} className="hover:text-foreground transition-colors">
          {t("detail.backToNews")}
        </Link>
        <span>›</span>
        <span className="truncate max-w-[200px] text-foreground">{article.title}</span>
      </nav>

      <div className="flex flex-col gap-4">
        <span
          className={`self-start text-xs font-semibold px-2 py-0.5 rounded-full ${categoryStyles[article.category]}`}
        >
          {t(`categories.${categoryKey}`)}
        </span>

        <h1 className="text-foreground font-bold text-3xl md:text-4xl leading-tight font-sans">
          {article.title}
        </h1>

        <div className="flex items-center gap-2 text-sm text-foreground-muted">
          <span>{article.author.name}</span>
          <span>·</span>
          <span>{formatDate(article.publishedAt, locale as "en" | "es" | "fr")}</span>
          <span>·</span>
          <span>
            {article.readingTimeMinutes} {t("card.minRead")}
          </span>
        </div>
      </div>

      <div className="relative w-full max-h-[400px] aspect-[16/7] overflow-hidden rounded-xl">
        <Image
          src={article.coverImage}
          alt={article.title}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 896px"
        />
      </div>

      <div
        className="prose text-foreground max-w-none"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {article.relatedArticles.length > 0 && (
        <section className="flex flex-col gap-4 pt-4 border-t border-border">
          <h2 className="text-foreground font-bold text-xl">{t("detail.relatedArticles")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {article.relatedArticles.map((related) => (
              <Link
                key={related.id}
                href={`/${locale}/news/${related.slug}`}
                className="block group"
              >
                <div className="bg-surface border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative aspect-video overflow-hidden">
                    <Image
                      src={related.coverImage}
                      alt={related.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, 300px"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-foreground line-clamp-2">
                      {related.title}
                    </p>
                    <p className="text-xs text-foreground-muted mt-1">
                      {formatDate(related.publishedAt, locale as "en" | "es" | "fr")}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
