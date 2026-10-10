"use client";

import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Same frame as the profile pages (cover, avatar, name, tabs) so the real
 * profile replaces it without moving the layout.
 */
export function ProfilePageSkeleton() {
  const t = useTranslations("profile");

  return (
    <main
      aria-busy="true"
      aria-label={t("loadingProfile")}
      className="bg-overlay max-w-5xl mx-auto pb-24"
    >
      <Skeleton className="h-48 sm:h-64 w-full rounded-none" />
      <div className="px-4 sm:px-8 -mt-12 flex flex-col sm:flex-row items-center sm:items-end gap-4">
        <Skeleton className="size-28 rounded-full border-4 border-background" />
        <div className="flex-1 w-full space-y-2 pb-2">
          <Skeleton className="h-7 w-48 mx-auto sm:mx-0" />
          <Skeleton className="h-4 w-32 mx-auto sm:mx-0" />
        </div>
      </div>
      <div className="px-4 sm:px-8 mt-6 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-3 pt-4">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
    </main>
  );
}
