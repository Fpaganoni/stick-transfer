"use client";

import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";

const PLACEHOLDER_CARDS = 3;

/**
 * Placeholder for the main area of the AppShell while the auth store hydrates
 * (first load only). The sidebar and header stay on screen; only this block is
 * swapped.
 *
 * Deliberately not used as (app)/loading.tsx: streaming the shell before the
 * server data made the cold-load LCP worse in Lighthouse (8.7s vs 5.0s).
 */
export function PageContentSkeleton() {
  const t = useTranslations("pageTitles");

  return (
    <div aria-busy="true" aria-label={t("loading")} className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <Skeleton className="h-8 w-1/3" />
      {Array.from({ length: PLACEHOLDER_CARDS }, (_, idx) => (
        <div key={idx} className="rounded-xl border border-border p-4 space-y-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-16 w-full" />
        </div>
      ))}
    </div>
  );
}
