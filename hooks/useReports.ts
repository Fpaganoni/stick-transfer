import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { graphqlClient } from "@/lib/graphql-client";
import { GET_REPORTS, UPDATE_REPORT_STATUS } from "@/graphql";
import {
  Report,
  ReportFilters,
  ReportsResponse,
  ReportStatus,
  UpdateReportStatusResponse,
} from "@/types/models/report";

const REPORTS_KEY = ["admin", "reports"] as const;

export function useReports(filters?: ReportFilters, page = 1, limit = 20) {
  return useQuery<ReportsResponse>({
    queryKey: [...REPORTS_KEY, filters, page],
    queryFn: async () =>
      graphqlClient.request<ReportsResponse>(GET_REPORTS, {
        status: filters?.status,
        targetType: filters?.targetType,
        page,
        limit,
      }),
    staleTime: 60_000,
  });
}

type ReportMutationContext = {
  previousLists?: [readonly unknown[], ReportsResponse | undefined][];
};

export function useUpdateReportStatus() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin.reports");

  return useMutation<
    UpdateReportStatusResponse,
    Error,
    { id: string; status: ReportStatus },
    ReportMutationContext
  >({
    mutationFn: async (variables) => graphqlClient.request(UPDATE_REPORT_STATUS, variables),

    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: REPORTS_KEY });

      const previousLists = queryClient.getQueriesData<ReportsResponse>({
        queryKey: REPORTS_KEY,
      });

      queryClient.setQueriesData<ReportsResponse>({ queryKey: REPORTS_KEY }, (old) => {
        if (!old) return old;
        return {
          reports: {
            ...old.reports,
            items: old.reports.items.map((item: Report) =>
              item.id === id ? { ...item, status } : item
            ),
          },
        };
      });

      return { previousLists };
    },

    onSuccess: () => {
      toast.success(t("toasts.statusUpdated"));
    },

    onError: (_err, _vars, context) => {
      context?.previousLists?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toast.error(t("toasts.actionFailed"));
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: REPORTS_KEY });
    },
  });
}
