import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import { GET_CLUBS, GET_CLUB } from "@/graphql/club/queries";
import { UPDATE_CLUB } from "@/graphql/club/mutations";
import { Club, UpdateClubVariables } from "@/types/models/club";

// Club verification mutations live in hooks/useClubMutations.ts

export function useClubs(initialData?: { clubs: Club[] }) {
  return useQuery<{ clubs: Club[] }>({
    queryKey: ["clubs"],
    queryFn: async () => graphqlClient.request(GET_CLUBS),
    initialData,
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
    },
  });
}
