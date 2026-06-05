import { Suspense } from "react";
import { Loader } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AppShell } from "@/components/layout/app-shell";
import { NewsPage } from "@/components/pages/news-page";

export default async function NewsRoute() {
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
        <NewsPage />
      </Suspense>
    </AppShell>
  );
}
