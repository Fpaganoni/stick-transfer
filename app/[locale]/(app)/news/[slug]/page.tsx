import { Suspense } from "react";
import { Loader } from "lucide-react";
import { NewsDetailPage } from "@/components/pages/news-detail-page";

interface NewsArticleRouteProps {
  params: Promise<{ slug: string }>;
}

export default async function NewsArticleRoute({ params }: NewsArticleRouteProps) {
  const { slug } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-8">
          <Loader className="animate-spin text-primary" />
        </div>
      }
    >
      <NewsDetailPage slug={slug} />
    </Suspense>
  );
}
