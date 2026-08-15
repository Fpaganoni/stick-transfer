import { useQuery } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import { ADMIN_JOB_OPPORTUNITIES } from "@/graphql";
import { AdminJobFilters, AdminJobOpportunityRow } from "@/types/models/admin";

const ADMIN_JOBS_KEY = ["admin", "jobs", "opportunities"] as const;

interface AdminJobOpportunitiesResponse {
  jobOpportunities: AdminJobOpportunityRow[];
}

// GAP backend: no existe adminJobOpportunities — se usa jobOpportunities con
// filtros/paginación reales (JobOpportunityFiltersInput). Retorna array plano
// sin total/hasMore; la page aplica una heurística de paginación (igual que
// /admin/reports).
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
