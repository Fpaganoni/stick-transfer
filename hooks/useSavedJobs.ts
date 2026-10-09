import {
  QueryClient,
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { graphqlClient } from "@/lib/graphql-client";
import { GET_SAVED_JOBS, SAVE_JOB, UNSAVE_JOB } from "@/graphql";
import { useAuthStore } from "@/stores/useAuthStore";
import { useOpportunitiesStore } from "@/stores/useOpportunitiesStore";
import type { JobOpportunity } from "@/types/models/job-opportunity";

export const SAVED_JOBS_QUERY_KEY = ["savedJobs"] as const;
const JOB_OPPORTUNITIES_QUERY_KEY = ["jobOpportunities"] as const;

interface JobOpportunitiesData {
  jobOpportunities: JobOpportunity[];
}

interface SavedJobsData {
  savedJobOpportunities: JobOpportunity[];
}

type ToggleSaveJobResponse =
  | { saveJobOpportunity: boolean }
  | { unsaveJobOpportunity: boolean };

export interface ToggleSaveJobVariables {
  job: JobOpportunity;
  /** Desired state after the mutation: true = save, false = unsave. */
  save: boolean;
}

interface ToggleSaveJobContext {
  previousSavedJobs: SavedJobsData | undefined;
  previousJobLists: Array<[QueryKey, JobOpportunitiesData | undefined]>;
  /** Account that made the change; a rollback must not outlive it. */
  userId: string | undefined;
}

/**
 * Jobs the current account saved, straight from the server.
 * Disabled without a session so a logged-out visitor never hits the endpoint.
 */
export function useSavedJobs() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery<SavedJobsData>({
    queryKey: SAVED_JOBS_QUERY_KEY,
    queryFn: () => graphqlClient.request<SavedJobsData>(GET_SAVED_JOBS),
    enabled: isLoggedIn,
  });
}

function withSavedFlag(job: JobOpportunity, save: boolean): JobOpportunity {
  return { ...job, isSavedByCurrentUser: save };
}

function applyOptimisticToggle(
  queryClient: QueryClient,
  { job, save }: ToggleSaveJobVariables,
) {
  queryClient.setQueryData<SavedJobsData>(SAVED_JOBS_QUERY_KEY, (old) => {
    if (!old) return old;
    const others = old.savedJobOpportunities.filter((saved) => saved.id !== job.id);
    return {
      ...old,
      savedJobOpportunities: save
        ? [withSavedFlag(job, true), ...others]
        : others,
    };
  });

  queryClient.setQueriesData<JobOpportunitiesData>(
    { queryKey: JOB_OPPORTUNITIES_QUERY_KEY },
    (old) =>
      old && {
        ...old,
        jobOpportunities: old.jobOpportunities.map((item) =>
          item.id === job.id ? withSavedFlag(item, save) : item,
        ),
      },
  );

  // The detail modal renders a snapshot held in the store, not the cache.
  const { selectedOpportunity, setSelectedOpportunity } =
    useOpportunitiesStore.getState();
  if (selectedOpportunity?.id === job.id) {
    setSelectedOpportunity(withSavedFlag(selectedOpportunity, save));
  }
}

/**
 * Save / unsave a job for the current account with an optimistic update on
 * ["savedJobs"] and every ["jobOpportunities"] list. Rolls back on failure and
 * refetches once settled so the server stays the source of truth.
 */
export function useToggleSaveJob() {
  const queryClient = useQueryClient();
  const t = useTranslations("opportunities");

  return useMutation<
    ToggleSaveJobResponse,
    Error,
    ToggleSaveJobVariables,
    ToggleSaveJobContext
  >({
    mutationFn: ({ job, save }) =>
      graphqlClient.request<ToggleSaveJobResponse>(save ? SAVE_JOB : UNSAVE_JOB, {
        jobOpportunityId: job.id,
      }),

    onMutate: async (variables) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: SAVED_JOBS_QUERY_KEY }),
        queryClient.cancelQueries({ queryKey: JOB_OPPORTUNITIES_QUERY_KEY }),
      ]);

      const context: ToggleSaveJobContext = {
        previousSavedJobs: queryClient.getQueryData<SavedJobsData>(SAVED_JOBS_QUERY_KEY),
        previousJobLists: queryClient.getQueriesData<JobOpportunitiesData>({
          queryKey: JOB_OPPORTUNITIES_QUERY_KEY,
        }),
        userId: useAuthStore.getState().user?.id,
      };

      applyOptimisticToggle(queryClient, variables);
      return context;
    },

    onError: (_error, { job, save }, context) => {
      // A logout or account switch while the request was in flight already
      // cleared the cache. Restoring the snapshot would bring the previous
      // account's data back for the next one.
      if (!context || useAuthStore.getState().user?.id !== context.userId) return;

      queryClient.setQueryData(SAVED_JOBS_QUERY_KEY, context.previousSavedJobs);
      context.previousJobLists.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });

      // Undo the flag on whatever the modal shows now; it may have been opened
      // after the click, so a snapshot taken earlier could be null or another job.
      const { selectedOpportunity, setSelectedOpportunity } =
        useOpportunitiesStore.getState();
      if (selectedOpportunity?.id === job.id) {
        setSelectedOpportunity(withSavedFlag(selectedOpportunity, !save));
      }

      toast.error(t("saveJobError"));
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SAVED_JOBS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: JOB_OPPORTUNITIES_QUERY_KEY });
    },
  });
}
