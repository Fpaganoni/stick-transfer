import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  AVAILABLE_COUNTRIES_QUERY,
  EXPLORE_USERS_QUERY,
} from "@/graphql/user/queries";
import { normalizeCountry } from "@/lib/countries";
import { graphqlClient } from "@/lib/graphql-client";
import { ExploreUser } from "@/types/models/user";

export interface ExploreFilters {
  searchQuery?: string;
  role?: string;
  position?: string;
  level?: string;
  country?: string;
  licenseLevel?: string;
  modality?: string;
  umpireCategory?: string;
  limit?: number;
  offset?: number;
}

interface ExploreUsersResponse {
  exploreUsers: ExploreUser[];
}

export function useExploreUsers(filters: ExploreFilters = {}) {
  const {
    searchQuery,
    role,
    position,
    level,
    country,
    licenseLevel,
    modality,
    umpireCategory,
    limit = 50,
    offset = 0,
  } = filters;

  return useQuery<ExploreUsersResponse>({
    queryKey: [
      "explore",
      searchQuery,
      role,
      position,
      level,
      country,
      licenseLevel,
      modality,
      umpireCategory,
      limit,
      offset,
    ],
    queryFn: () =>
      graphqlClient.request<ExploreUsersResponse>(EXPLORE_USERS_QUERY, {
        searchQuery: searchQuery || undefined,
        role: role || undefined,
        position: position || undefined,
        level: level || undefined,
        country: country || undefined,
        licenseLevel: licenseLevel || undefined,
        modality: modality || undefined,
        umpireCategory: umpireCategory || undefined,
        limit,
        offset,
      }),
    // "Load more" re-queries with a bigger limit; keep the current list on screen meanwhile
    placeholderData: keepPreviousData,
  });
}

interface AvailableCountriesResponse {
  availableCountries: string[];
}

const AVAILABLE_COUNTRIES_STALE_MS = 5 * 60 * 1000;

/** Countries that have active users or clubs: the explore country filter. */
export function useAvailableCountries() {
  return useQuery({
    queryKey: ["explore", "availableCountries"],
    queryFn: () =>
      graphqlClient.request<AvailableCountriesResponse>(AVAILABLE_COUNTRIES_QUERY),
    select: (data) =>
      data.availableCountries
        .map((code) => normalizeCountry(code))
        .filter((code): code is string => code !== null),
    staleTime: AVAILABLE_COUNTRIES_STALE_MS,
  });
}
