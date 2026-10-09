import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import { APPLY_FOR_JOB, GET_USER_APPLICATIONS } from "@/graphql";
import { JobApplicationResponse } from "@/types/models/job-application";
import { useAuthStore } from "@/stores/useAuthStore";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

type ApplyForJobVariables = {
  jobOpportunityId: string;
  coverLetter?: string;
  resumeUrl?: string;
};

type ApplyForJobResponse = {
  applyForJob: JobApplicationResponse;
};

type UserApplicationsResponse = {
  userApplications: Array<{
    id: string;
    jobOpportunityId: string;
    status: string;
    appliedAt: string;
  }>;
};

/**
 * Hook to fetch user's job applications
 * Returns all applications by the authenticated user
 */
export function useUserApplications() {
  const { user } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ["userApplications", user?.id],
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
    hasAppliedTo: (opportunityId: string) => {
      return data?.some((app) => app.jobOpportunityId === opportunityId) ?? false;
    },
  };
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

    onSuccess: () => {
      // Invalidate job opportunities to refresh the list
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
