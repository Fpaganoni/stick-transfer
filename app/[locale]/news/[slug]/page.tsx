import { Suspense } from "react";
import { Loader } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AppShell } from "@/components/layout/app-shell";
import { NewsDetailPage } from "@/components/pages/news-detail-page";

interface NewsArticleRouteProps {
  params: Promise<{ slug: string }>;
}

export default async function NewsArticleRoute({ params }: NewsArticleRouteProps) {
  const { slug } = await params;
  const t = await getTranslations("news");

  return (
    <AppShell title={t("pageTitle")}>
      <Suspense
        fallback={
          <div className="flex justify-center p-8">
            <Loader className="animate-spin text-primary" />
          </div>
        }
      >
        <NewsDetailPage slug={slug} />
      </Suspense>
    </AppShell>
  );
}
