import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import { ADMIN_JOB_OPPORTUNITIES, ADMIN_JOB_APPLICATIONS, ADMIN_UPDATE_APPLICATION_STATUS } from "@/graphql";
import {
  AdminApplicationFilters,
  AdminJobApplicationRow,
  AdminJobFilters,
  AdminJobOpportunityRow,
  PaginatedResponse,
} from "@/types/models/admin";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

const ADMIN_JOBS_KEY = ["admin", "jobs", "opportunities"] as const;
const ADMIN_APPLICATIONS_KEY = ["admin", "jobs", "applications"] as const;

interface AdminJobOpportunitiesResponse {
  adminJobOpportunities: PaginatedResponse<AdminJobOpportunityRow>;
}

interface AdminJobApplicationsResponse {
  adminJobApplications: PaginatedResponse<AdminJobApplicationRow>;
}

export function useAdminJobOpportunities(filters?: AdminJobFilters, page = 1, limit = 20) {
  return useQuery<AdminJobOpportunitiesResponse>({
    queryKey: [...ADMIN_JOBS_KEY, filters, page],
    queryFn: async () =>
      graphqlClient.request<AdminJobOpportunitiesResponse>(ADMIN_JOB_OPPORTUNITIES, {
        filters,
        page,
        limit,
      }),
    staleTime: 60_000,
  });
}

export function useAdminJobApplications(filters?: AdminApplicationFilters, page = 1, limit = 20) {
  return useQuery<AdminJobApplicationsResponse>({
    queryKey: [...ADMIN_APPLICATIONS_KEY, filters, page],
    queryFn: async () =>
      graphqlClient.request<AdminJobApplicationsResponse>(ADMIN_JOB_APPLICATIONS, {
        filters,
        page,
        limit,
      }),
    staleTime: 60_000,
  });
}

type ApplicationMutationContext = {
  previousLists?: [readonly unknown[], AdminJobApplicationsResponse | undefined][];
};

export function useAdminUpdateApplicationStatus() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin.jobs");

  return useMutation<
    { updateApplicationStatus: { id: string; status: string } },
    Error,
    { id: string; status: string },
    ApplicationMutationContext
  >({
    mutationFn: async (variables) =>
      graphqlClient.request(ADMIN_UPDATE_APPLICATION_STATUS, variables),

    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ADMIN_APPLICATIONS_KEY });

      const previousLists = queryClient.getQueriesData<AdminJobApplicationsResponse>({
        queryKey: ADMIN_APPLICATIONS_KEY,
      });

      queryClient.setQueriesData<AdminJobApplicationsResponse>(
        { queryKey: ADMIN_APPLICATIONS_KEY },
        (old) => {
          if (!old) return old;
          return {
            adminJobApplications: {
              ...old.adminJobApplications,
              items: old.adminJobApplications.items.map((item) =>
                item.id === id ? { ...item, status } : item
              ),
            },
          };
        }
      );

      return { previousLists };
    },

    onSuccess: () => {
      toast.success(t("toasts.applicationStatusUpdated"));
    },

    onError: (_err, _vars, context) => {
      context?.previousLists?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toast.error(t("toasts.actionFailed"));
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_APPLICATIONS_KEY });
    },
  });
}
