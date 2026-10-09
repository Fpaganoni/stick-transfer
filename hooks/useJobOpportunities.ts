import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import { GET_JOB_OPPORTUNITIES } from "@/graphql/opportunity/queries";
import { CREATE_JOB_OPPORTUNITY } from "@/graphql/opportunity/mutations";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  CreateJobOpportunityVariables,
  JobOpportunity,
} from "@/types/models/job-opportunity";

interface GetJobOpportunitiesVariables {
  limit?: number;
  offset?: number;
  clubId?: string;
}

export function useJobOpportunities(
  variables?: GetJobOpportunitiesVariables,
  initialData?: { jobOpportunities: JobOpportunity[] }
) {
  const { clubId, ...queryVars } = variables ?? {};
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery<{ jobOpportunities: JobOpportunity[] }>({
    queryKey: ["jobOpportunities", variables],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        jobOpportunities: JobOpportunity[];
      }>(GET_JOB_OPPORTUNITIES, queryVars);

      if (clubId) {
        return {
          jobOpportunities: data.jobOpportunities.filter(
            (op) => op.club?.id === clubId
          ),
        };
      }
      return data;
    },
    initialData,
    // The server render has no session cookie, so per-user fields such as
    // isSavedByCurrentUser come back false. Mark the data as stale with a
    // session so it is refetched on mount instead of trusted for staleTime.
    initialDataUpdatedAt: initialData && isLoggedIn ? 0 : undefined,
  });
}

export function useCreateJobOpportunity() {
  const queryClient = useQueryClient();

  return useMutation<
    { createJobOpportunity: JobOpportunity },
    Error,
    CreateJobOpportunityVariables
  >({
    mutationFn: async (variables) =>
      graphqlClient.request(CREATE_JOB_OPPORTUNITY, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobOpportunities"] });
    },
  });
}
