import { useQuery } from "@tanstack/react-query";
import { EXPLORE_USERS_QUERY } from "@/graphql/user/queries";
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
  });
}
