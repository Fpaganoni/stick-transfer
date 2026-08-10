import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import { CREATE_REPORT } from "@/graphql/report/mutations";

interface CreateReportVariables {
  targetType: string;
  targetId: string;
  reason: string;
  description?: string;
}

export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation<{ createReport: { id: string } }, Error, CreateReportVariables>({
    mutationFn: (variables) => graphqlClient.request(CREATE_REPORT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
    },
  });
}
