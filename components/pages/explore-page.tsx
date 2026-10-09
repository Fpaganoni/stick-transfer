"use client";

import { useState, useEffect, useMemo } from "react";
import { ProfileCard } from "@/components/explore/profile-card";
import { FilterButton } from "@/components/explore/filter-button";
import { Filter } from "@/components/ui/filter";
import { useTranslations } from "next-intl";
import { useExploreUsers } from "@/hooks/useExplore";
import { Loader } from "../ui/loader";
import { Error } from "../ui/error";
import {
  UmpireLicenseLevel,
  UmpireModality,
  UmpireCategory,
} from "@/types/enums";
import { POSITION_OPTIONS } from "@/lib/positions";

const PAGE_SIZE = 50;
const UMPIRE_ROLE = "UMPIRE";
// Filters that only make sense for one side; dropped when the role changes
const UMPIRE_ONLY_FILTERS = ["licenseLevel", "modality", "umpireCategory"];
const PLAYER_ONLY_FILTERS = ["position", "level"];

const COUNTRY_OPTIONS = [
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
  const tUmpire = useTranslations("umpire");

  const [pageCount, setPageCount] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, string>
  >({});

  const debouncedSearch = useDebounce(searchQuery, 400);

  const isUmpireSearch = selectedFilters.role === UMPIRE_ROLE;
  const limit = PAGE_SIZE * pageCount;

  const { data, isLoading, error, isPlaceholderData } = useExploreUsers({
    searchQuery: debouncedSearch || undefined,
    role: selectedFilters.role || undefined,
    position: selectedFilters.position || undefined,
    level: selectedFilters.level || undefined,
    country: selectedFilters.country || undefined,
    licenseLevel: selectedFilters.licenseLevel || undefined,
    modality: selectedFilters.modality || undefined,
    umpireCategory: selectedFilters.umpireCategory || undefined,
    limit,
    offset: 0,
  });

  const users = useMemo(() => data?.exploreUsers ?? [], [data]);

  // The API returns no total: a full page means there may be more
  const isLoadingMore = isPlaceholderData && pageCount > 1;
  const hasMore = isLoadingMore || users.length === limit;

  const updateSearch = (value: string) => {
    setSearchQuery(value);
    setPageCount(1);
  };

  const setFilter = (key: string) => (value: string) => {
    setPageCount(1);
    setSelectedFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "role") {
        // Umpires have no position/level; players and coaches have no licence
        const dropped =
          value === UMPIRE_ROLE ? PLAYER_ONLY_FILTERS : UMPIRE_ONLY_FILTERS;
        dropped.forEach((k) => delete next[k]);
      }
      return next;
    });
  };

  const clearFilter = (key: string) => () => {
    setPageCount(1);
    setSelectedFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      if (key === "role") UMPIRE_ONLY_FILTERS.forEach((k) => delete next[k]);
      return next;
    });
  };

  const roleOptions = [
    { value: "PLAYER", label: t("roles.player") },
    { value: "COACH", label: t("roles.coach") },
    { value: UMPIRE_ROLE, label: t("roles.umpire") },
  ];

  const licenseLevelOptions = Object.values(UmpireLicenseLevel).map((v) => ({
    value: v,
    label: tUmpire(`licenseLevels.${v}`),
  }));
  const modalityOptions = Object.values(UmpireModality).map((v) => ({
    value: v,
    label: tUmpire(`modalities.${v}`),
  }));
  const categoryOptions = Object.values(UmpireCategory).map((v) => ({
    value: v,
    label: tUmpire(`categories.${v}`),
  }));

  const positionOptions = POSITION_OPTIONS.map((p) => ({
    value: p.value,
    label: t(`positions.${p.labelKey}`),
  }));

  const levelOptions = [
    { value: "PROFESSIONAL", label: t("levels.professional") },
    { value: "AMATEUR", label: t("levels.amateur") },
  ];

  return (
    <main className="max-w-2xl mx-auto pb-4">
      <div className="sticky top-16 bg-background/30 z-20 px-4 py-4 border-b border-border space-y-4 backdrop-blur-sm">
        <Filter
          value={searchQuery}
          onChange={updateSearch}
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
            options={COUNTRY_OPTIONS}
            activeValue={selectedFilters.country}
            onSelect={setFilter("country")}
            onClear={clearFilter("country")}
          />
          {isUmpireSearch ? (
            <>
              <FilterButton
                label={t("filters.licenseLevel")}
                options={licenseLevelOptions}
                activeValue={selectedFilters.licenseLevel}
                onSelect={setFilter("licenseLevel")}
                onClear={clearFilter("licenseLevel")}
              />
              <FilterButton
                label={t("filters.modality")}
                options={modalityOptions}
                activeValue={selectedFilters.modality}
                onSelect={setFilter("modality")}
                onClear={clearFilter("modality")}
              />
              <FilterButton
                label={t("filters.category")}
                options={categoryOptions}
                activeValue={selectedFilters.umpireCategory}
                onSelect={setFilter("umpireCategory")}
                onClear={clearFilter("umpireCategory")}
              />
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      <div className="px-4 mt-8 mb-28">
        {isLoading ? (
          <Loader>Loading</Loader>
        ) : error ? (
          <Error>Error loading users</Error>
        ) : users.length > 0 ? (
          <div className={isPlaceholderData && !isLoadingMore ? "opacity-60" : ""}>
            {users.map((profile) => (
              <ProfileCard key={profile.id} {...profile} />
            ))}
            {hasMore && (
              <button
                type="button"
                disabled={isLoadingMore}
                onClick={() => setPageCount((n) => n + 1)}
                className="w-full h-10 rounded-lg border border-border bg-background text-foreground font-medium cursor-pointer hover:bg-input transition-colors disabled:opacity-50 disabled:cursor-default"
              >
                {isLoadingMore ? t("loadingMore") : t("loadMore")}
              </button>
            )}
          </div>
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
