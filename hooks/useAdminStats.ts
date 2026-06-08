import { useQuery } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import { ADMIN_DASHBOARD_STATS } from "@/graphql";
import { AdminDashboardStatsResponse } from "@/types/models/admin";

export function useAdminStats() {
  return useQuery<AdminDashboardStatsResponse>({
    queryKey: ["admin", "stats"],
    queryFn: async () =>
      graphqlClient.request<AdminDashboardStatsResponse>(ADMIN_DASHBOARD_STATS),
    staleTime: 60_000,
  });
}
