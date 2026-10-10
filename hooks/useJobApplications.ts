import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import { APPLY_FOR_JOB, GET_USER_APPLICATIONS } from "@/graphql";
import { UserApplication } from "@/types/models/job-application";
import { JobOpportunity, JobOpportunityPreview } from "@/types/models/job-opportunity";
import { useAuthStore } from "@/stores/useAuthStore";
import { useOpportunitiesStore } from "@/stores/useOpportunitiesStore";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

type ApplyForJobVariables = {
  jobOpportunityId: string;
  coverLetter?: string;
  resumeUrl?: string;
};

type ApplyForJobResponse = {
  applyForJob: UserApplication;
};

type UserApplicationsResponse = {
  userApplications: UserApplication[];
};

type JobOpportunitiesData = { jobOpportunities: JobOpportunity[] };

const WITHDRAWN = "WITHDRAWN";

export function userApplicationsQueryKey(userId: string | undefined) {
  return ["userApplications", userId] as const;
}

/**
 * Hook to fetch user's job applications
 * Returns all applications by the authenticated user
 */
export function useUserApplications() {
  const { user } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: userApplicationsQueryKey(user?.id),
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const response = await graphqlClient.request<UserApplicationsResponse>(
        GET_USER_APPLICATIONS,
        { userId: user.id }
      );
      return response.userApplications;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    applications: data || [],
    isLoading,
    error,
    // A withdrawn application can be sent again, so it does not count
    hasAppliedTo: (opportunityId: string) =>
      data?.some(
        (app) => app.jobOpportunityId === opportunityId && app.status !== WITHDRAWN,
      ) ?? false,
  };
}

/**
 * Writes a successful application into every cache that renders it: the
 * user's applications (the backend reactivates a withdrawn row with the same
 * id, so it replaces instead of duplicating), the opportunity lists and the
 * snapshot the detail modal holds in its store.
 */
function writeApplicationToCache(
  queryClient: QueryClient,
  userId: string,
  application: UserApplication,
) {
  queryClient.setQueryData<UserApplication[]>(
    userApplicationsQueryKey(userId),
    (old = []) => [application, ...old.filter((app) => app.id !== application.id)],
  );

  const markApplied = <T extends JobOpportunityPreview>(job: T): T =>
    job.id === application.jobOpportunityId
      ? { ...job, hasAppliedByCurrentUser: true }
      : job;

  queryClient.setQueriesData<JobOpportunitiesData>(
    { queryKey: ["jobOpportunities"] },
    (old) => old && { ...old, jobOpportunities: old.jobOpportunities.map(markApplied) },
  );

  const { selectedOpportunity, setSelectedOpportunity } =
    useOpportunitiesStore.getState();
  if (selectedOpportunity && selectedOpportunity.id === application.jobOpportunityId) {
    setSelectedOpportunity(markApplied(selectedOpportunity));
  }
}

/**
 * Hook to apply for a job opportunity
 * Requires user to be authenticated
 */
export function useApplyForJob() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const t = useTranslations("opportunities");

  return useMutation<ApplyForJobResponse, Error, ApplyForJobVariables>({
    mutationFn: async ({
      jobOpportunityId,
      coverLetter,
      resumeUrl,
    }) => {
      if (!user?.id) {
        throw new Error("User must be authenticated to apply");
      }
      if (!jobOpportunityId) {
        throw new Error("Job Opportunity ID is required");
      }

      return graphqlClient.request(APPLY_FOR_JOB, {
        jobOpportunityId,
        userId: user.id,
        coverLetter,
        resumeUrl,
      });
    },

    onSuccess: (data) => {
      if (user?.id && data?.applyForJob) {
        writeApplicationToCache(queryClient, user.id, data.applyForJob);
      }
      queryClient.invalidateQueries({ queryKey: ["jobOpportunities"] });
      queryClient.invalidateQueries({ queryKey: ["userApplications"] });

      toast.success(t("applicationSubmitted"), {
        description: t("applicationSubmittedDescription"),
      });
    },

    onError: (error: Error) => {
      // Handle specific error cases
      const errorMessage = error.message.toLowerCase();

      if (errorMessage.includes("authenticated")) {
        toast.error("Please log in to apply", {
          description: "You must be authenticated to apply for opportunities",
        });
      } else if (
        errorMessage.includes("already applied") ||
        errorMessage.includes("unique constraint") ||
        errorMessage.includes("duplicate") ||
        errorMessage.includes("already exists")
      ) {
        // Handle duplicate application error from backend
        toast.error(t("alreadyApplied"), {
          description: t("applicationSubmittedDescription"),
        });
      } else if (errorMessage.includes("opportunity not found")) {
        toast.error(t("opportunityNotFound"));
      } else {
        toast.error(t("applicationFailed"), {
          description: error.message,
        });
      }
    },
  });
}
