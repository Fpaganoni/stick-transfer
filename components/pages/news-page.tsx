"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader } from "lucide-react";
import { useNewsQuery } from "@/hooks/useNews";
import type { NewsCategory } from "@/hooks/useNews";
import { NewsHeroCard } from "@/components/news/news-hero-card";
import { NewsCard } from "@/components/news/news-card";
import { NewsFilters } from "@/components/news/news-filters";

export function NewsPage() {
  const t = useTranslations("news");
  const [activeCategory, setActiveCategory] = useState<NewsCategory | "ALL">("ALL");
  const [page, setPage] = useState(1);

  const filters = activeCategory === "ALL" ? undefined : { category: activeCategory };
  const { data, isLoading } = useNewsQuery(filters, page);

  const articles = data?.news.items ?? [];
  const hasMore = data?.news.hasMore ?? false;
  const [heroArticle, ...restArticles] = articles;

  function handleCategoryChange(cat: NewsCategory | "ALL") {
    setActiveCategory(cat);
    setPage(1);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-foreground font-bold text-3xl md:text-4xl font-sans">
          {t("pageTitle")}
        </h1>
        <p className="text-foreground-muted text-lg">{t("pageSubtitle")}</p>
      </header>

      <NewsFilters active={activeCategory} onChange={handleCategoryChange} />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader className="animate-spin text-primary" size={32} />
        </div>
      ) : articles.length === 0 ? (
        <p className="text-foreground-muted text-center py-16">{t("empty")}</p>
      ) : (
        <>
          {heroArticle && <NewsHeroCard article={heroArticle} />}

          {restArticles.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {restArticles.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          )}

          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="border border-border text-foreground px-6 py-2.5 rounded-lg hover:bg-surface-elevated transition-colors text-sm font-medium"
              >
                {t("loadMore")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
