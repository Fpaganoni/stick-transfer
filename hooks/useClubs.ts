import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import { GET_CLUBS, GET_CLUB } from "@/graphql/club/queries";
import { UPDATE_CLUB } from "@/graphql/club/mutations";
import { Club, UpdateClubVariables } from "@/types/models/club";
import { fetchAllPages } from "@/lib/fetch-all-pages";

// Club verification mutations live in hooks/useClubMutations.ts

/**
 * The clubs page filters on the client, so it needs the whole list: pages of
 * 100 are fetched until a short one arrives. `initialData` is the SSR first
 * page only, so it is marked stale and completed on mount.
 */
export function useClubs(initialData?: { clubs: Club[] }) {
  return useQuery<{ clubs: Club[] }>({
    queryKey: ["clubs"],
    queryFn: async () => ({
      clubs: await fetchAllPages(async (limit, offset) => {
        const page = await graphqlClient.request<{ clubs: Club[] }>(GET_CLUBS, { limit, offset });
        return page.clubs;
      }),
    }),
    initialData,
    initialDataUpdatedAt: 0,
  });
}

export function useClub(id: string | null) {
  return useQuery<{ club: Club }>({
    queryKey: ["club", id],
    queryFn: async () => graphqlClient.request(GET_CLUB, { id }),
    enabled: !!id,
  });
}

export function useUpdateClub() {
  const queryClient = useQueryClient();

  return useMutation<{ updateClub: Club }, Error, UpdateClubVariables>({
    mutationFn: async (variables) =>
      graphqlClient.request(UPDATE_CLUB, variables),
    onSuccess: (data) => {
      if (data?.updateClub?.id) {
        queryClient.invalidateQueries({ queryKey: ["club", data.updateClub.id] });
      }
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
      // The club IS the account: the session, the profile by username and every
      // vacancy carrying the club name and crest change with it
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["jobOpportunities"] });
    },
  });
}
