"use client";

import { useState, useEffect, useMemo } from "react";
import { ProfileCard } from "@/components/explore/profile-card";
import { FilterButton } from "@/components/explore/filter-button";
import { Filter } from "@/components/ui/filter";
import { useTranslations } from "next-intl";
import { useExploreUsers } from "@/hooks/useExplore";
import { Loader } from "../ui/loader";
import { Error } from "../ui/error";

// Debounce: only fire the query after the user stops typing for 400ms
function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function ExplorePage() {
  const t = useTranslations("explore");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, string>
  >({});

  const debouncedSearch = useDebounce(searchQuery, 400);

  const { data, isLoading, error } = useExploreUsers({
    searchQuery: debouncedSearch || undefined,
    role: selectedFilters.role || undefined,
    position: selectedFilters.position || undefined,
    level: selectedFilters.level || undefined,
    country: selectedFilters.country || undefined,
    limit: 50,
    offset: 0,
  });

  const users = useMemo(() => data?.exploreUsers ?? [], [data]);

  const setFilter = (key: string) => (value: string) =>
    setSelectedFilters((prev) => ({ ...prev, [key]: value }));

  const clearFilter = (key: string) => () =>
    setSelectedFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const roleOptions = [
    { value: "PLAYER", label: t("roles.player") },
    { value: "COACH", label: t("roles.coach") },
    { value: "CLUB", label: t("roles.clubAdmin") },
  ];

  const positionOptions = [
    { value: "attacker", label: t("positions.forward") },
    { value: "midfielder", label: t("positions.midfielder") },
    { value: "defender", label: t("positions.defender") },
    { value: "goalkeeper", label: t("positions.goalkeeper") },
  ];

  const levelOptions = [
    { value: "PROFESSIONAL", label: t("levels.professional") },
    { value: "AMATEUR", label: t("levels.amateur") },
  ];

  const countryOptions = [
    { value: "AR", label: "🇦🇷 Argentina" },
    { value: "AT", label: "🇦🇹 Austria" },
    { value: "BE", label: "🇧🇪 Belgium" },
    { value: "CA", label: "🇨🇦 Canada" },
    { value: "CL", label: "🇨🇱 Chile" },
    { value: "DK", label: "🇩🇰 Denmark" },
    { value: "FI", label: "🇫🇮 Finland" },
    { value: "FR", label: "🇫🇷 France" },
    { value: "DE", label: "🇩🇪 Germany" },
    { value: "IT", label: "🇮🇹 Italy" },
    { value: "NL", label: "🇳🇱 Netherlands" },
    { value: "PT", label: "🇵🇹 Portugal" },
    { value: "ES", label: "🇪🇸 Spain" },
    { value: "SE", label: "🇸🇪 Sweden" },
    { value: "CH", label: "🇨🇭 Switzerland" },
    { value: "GB", label: "🇬🇧 UK" },
    { value: "US", label: "🇺🇸 USA" },
  ];

  return (
    <main className="max-w-2xl mx-auto pb-4">
      <div className="sticky top-16 bg-background/30 z-20 px-4 py-4 border-b border-border space-y-4 backdrop-blur-sm">
        <Filter
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t("searchPlaceholder")}
          className="relative"
        />

        <div className="flex gap-2 flex-wrap">
          <FilterButton
            label={t("filters.role")}
            options={roleOptions}
            activeValue={selectedFilters.role}
            onSelect={setFilter("role")}
            onClear={clearFilter("role")}
          />
          <FilterButton
            label={t("filters.country")}
            options={countryOptions}
            activeValue={selectedFilters.country}
            onSelect={setFilter("country")}
            onClear={clearFilter("country")}
          />
          <FilterButton
            label={t("filters.level")}
            options={levelOptions}
            activeValue={selectedFilters.level}
            onSelect={setFilter("level")}
            onClear={clearFilter("level")}
          />
          <FilterButton
            label={t("filters.position")}
            options={positionOptions}
            activeValue={selectedFilters.position}
            onSelect={setFilter("position")}
            onClear={clearFilter("position")}
          />
        </div>
      </div>

      <div className="px-4 mt-8 mb-28">
        {isLoading ? (
          <Loader>Loading</Loader>
        ) : error ? (
          <Error>Error loading users</Error>
        ) : users.length > 0 ? (
          users.map((profile) => <ProfileCard key={profile.id} {...profile} />)
        ) : (
          <p className="text-center text-foreground py-8">
            {t("noResults")}{" "}
            {searchQuery
              ? `"${searchQuery}"`
              : Object.values(selectedFilters).join(", ")}
          </p>
        )}
      </div>
    </main>
  );
}
