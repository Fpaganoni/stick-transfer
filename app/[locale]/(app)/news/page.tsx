import { Suspense } from "react";
import { Loader } from "lucide-react";
import { NewsPage } from "@/components/pages/news-page";

export default function NewsRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-8">
          <Loader className="animate-spin text-primary" />
        </div>
      }
    >
      <NewsPage />
    </Suspense>
  );
}
