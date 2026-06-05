import { useQuery } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import { GET_JOB_OPPORTUNITIES } from "@/graphql/opportunity/queries";
import { JobOpportunity } from "@/types/models/job-opportunity";

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
  });
}
