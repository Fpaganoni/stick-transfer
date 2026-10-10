import {
  queryOptions,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { graphqlClient } from "@/lib/graphql-client";
import {
  GET_JOB_OPPORTUNITIES,
  GET_JOB_OPPORTUNITY,
} from "@/graphql/opportunity/queries";
import { CREATE_JOB_OPPORTUNITY } from "@/graphql/opportunity/mutations";
import { useAuthStore } from "@/stores/useAuthStore";
import { useOpportunitiesStore } from "@/stores/useOpportunitiesStore";
import {
  CreateJobOpportunityVariables,
  JobOpportunity,
  JobOpportunityPreview,
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

export function jobOpportunityQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["jobOpportunity", id],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        jobOpportunity: JobOpportunity | null;
      }>(GET_JOB_OPPORTUNITY, { id });
      return data.jobOpportunity;
    },
  });
}

/**
 * Opens the detail modal at once with a light copy of the opportunity (e.g.
 * the one nested in the user's applications) and swaps in the full one when it
 * arrives, unless the user opened another opportunity meanwhile.
 */
export function useOpenOpportunityDetail() {
  const queryClient = useQueryClient();
  const t = useTranslations("opportunities");

  return (preview: JobOpportunityPreview) => {
    const { setSelectedOpportunity, setIsModalOpen } = useOpportunitiesStore.getState();
    setSelectedOpportunity(preview);
    setIsModalOpen(true);

    const isStillOpen = () =>
      useOpportunitiesStore.getState().selectedOpportunity?.id === preview.id;

    queryClient
      .fetchQuery(jobOpportunityQueryOptions(preview.id))
      .then((opportunity) => {
        if (!isStillOpen()) return;
        if (!opportunity) throw new Error("Opportunity not found");
        useOpportunitiesStore.getState().setSelectedOpportunity(opportunity);
      })
      .catch(() => {
        if (!isStillOpen()) return;
        useOpportunitiesStore.getState().closeModal();
        toast.error(t("opportunityNotFound"));
      });
  };
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
