"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useClubs } from "@/hooks/useClubs";
import { useAuthStore } from "@/stores/useAuthStore";
import { ClubListCard } from "@/components/clubs/club-list-card";
import { Error } from "@/components/ui/error";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Club } from "@/types/models/club";

interface ClubsPageProps {
  initialData?: { clubs: Club[] };
}

function ClubCardSkeleton() {
  return (
    <div className="w-40 h-[200px] bg-surface border border-border rounded-xl p-3 animate-pulse flex flex-col items-center">
      <div className="mt-4 mb-2 w-20 h-20 rounded-full bg-surface-elevated" />
      <div className="h-3 w-24 bg-surface-elevated rounded mt-1" />
      <div className="h-3 w-16 bg-surface-elevated rounded mt-1" />
      <div className="mt-auto h-4 w-6 bg-surface-elevated rounded" />
    </div>
  );
}

export function ClubsPage({ initialData }: ClubsPageProps) {
  const t = useTranslations("clubs");
  const [tab, setTab] = useState("all");
  const { data, isLoading, error } = useClubs(initialData);
  const user = useAuthStore((s) => s.user);

  const allClubs = useMemo(() => data?.clubs ?? [], [data?.clubs]);

  const myClubs = useMemo(
    () =>
      allClubs.filter((club) =>
        club.members?.some((m) => m.user.id === user?.id)
      ),
    [allClubs, user]
  );

  const activeClubs = tab === "my" ? myClubs : allClubs;

  if (error && !data?.clubs) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Error>{t("noClubs")}</Error>
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 pb-24">
      {/* Header */}
      <div className="pt-8 pb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {t("pageTitle")}
        </h1>
        <p className="text-foreground-muted text-sm">{t("pageSubtitle")}</p>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">
            {t("allClubhouses")}
            {!isLoading && (
              <span className="ml-1 text-foreground-muted text-xs">
                ({allClubs.length})
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="my">
            {t("myClubhouses")}
            {!isLoading && (
              <span className="ml-1 text-foreground-muted text-xs">
                ({myClubs.length})
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <ClubGrid clubs={activeClubs} isLoading={isLoading && !initialData} />
        </TabsContent>
        <TabsContent value="my">
          <ClubGrid clubs={myClubs} isLoading={false} />
        </TabsContent>
      </Tabs>
    </main>
  );
}

function ClubGrid({
  clubs,
  isLoading,
}: {
  clubs: Club[];
  isLoading: boolean;
}) {
  const t = useTranslations("clubs");
  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ClubCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (clubs.length === 0) {
    return (
      <Empty className="border border-dashed border-border mt-4">
        <EmptyHeader>
          <EmptyTitle>{t("noClubs")}</EmptyTitle>
          <EmptyDescription>{t("noClubsDescription")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-wrap gap-4">
      {clubs.map((club) => (
        <ClubListCard key={club.id} {...club} />
      ))}
    </div>
  );
}
