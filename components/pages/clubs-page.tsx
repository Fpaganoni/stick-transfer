"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useClubs } from "@/hooks/useClubs";
import { ClubListCard } from "@/components/clubs/club-list-card";
import { Loader } from "@/components/ui/loader";
import { Error } from "@/components/ui/error";
import { Club } from "@/types/models/club";

interface ClubsPageProps {
  initialData?: { clubs: Club[] };
}

export function ClubsPage({ initialData }: ClubsPageProps) {
  const t = useTranslations("clubs");
  const [searchQuery, setSearchQuery] = useState("");
  const { data, isLoading, error } = useClubs(initialData);

  const filteredClubs = useMemo(() => {
    if (!data?.clubs) return [];
    const query = searchQuery.toLowerCase();
    return data.clubs.filter(
      (club) =>
        club.name.toLowerCase().includes(query) ||
        club.city?.toLowerCase().includes(query) ||
        club.country?.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  if (isLoading && !initialData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader>{t("loading")}</Loader>
      </div>
    );
  }

  if (error && !data?.clubs) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Error>{t("noClubs")}</Error>
      </div>
    );
  }

  return (
    <main className="bg-overlay max-w-2xl mx-auto px-4 pb-24">
      <div className="sticky top-16 bg-background border-b border-border rounded-b-lg shadow-md px-4 py-4 z-20">
        <h1 className="text-2xl font-bold text-foreground mb-4">
          {t("title")}
        </h1>
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="space-y-4 mt-6">
        {filteredClubs.length > 0 ? (
          filteredClubs.map((club) => <ClubListCard key={club.id} {...club} />)
        ) : (
          <div className="text-center text-foreground/70 py-8">
            {t("noClubs")}
          </div>
        )}
      </div>
    </main>
  );
}
