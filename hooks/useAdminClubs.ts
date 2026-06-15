import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import { ADMIN_CLUBS, ADMIN_SET_CLUB_VERIFICATION } from "@/graphql";
import {
  AdminClubFilters,
  AdminClubRow,
  AdminClubsResponse,
  ClubVerificationStatus,
} from "@/types/models/admin";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

const ADMIN_CLUBS_KEY = ["admin", "clubs"] as const;

// GAP backend: `clubs` no expone membersCount — se deriva de members.length.
interface RawClubRow extends Omit<AdminClubRow, "membersCount"> {
  members?: { id: string }[];
}

interface ClubsResponse {
  clubs: RawClubRow[];
}

function toAdminClubRow(club: RawClubRow): AdminClubRow {
  const { members, ...rest } = club;
  return { ...rest, membersCount: members?.length ?? 0 };
}

function applyClubFilters(clubs: RawClubRow[], filters?: AdminClubFilters): RawClubRow[] {
  return clubs.filter((club) => {
    if (filters?.verificationStatus && club.verificationStatus !== filters.verificationStatus) {
      return false;
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      const haystack = `${club.name} ${club.city ?? ""} ${club.country ?? ""} ${club.league ?? ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

// GAP backend: no existe adminClubs/AdminClubFiltersInput — `clubs` no soporta
// filtros ni paginación. Se trae la lista completa y se filtra/pagina aquí.
export function useAdminClubs(filters?: AdminClubFilters, page = 1, limit = 20) {
  return useQuery<ClubsResponse, Error, AdminClubsResponse>({
    queryKey: ADMIN_CLUBS_KEY,
    queryFn: async () => graphqlClient.request<ClubsResponse>(ADMIN_CLUBS),
    select: (data) => {
      const filtered = applyClubFilters(data.clubs, filters);
      const start = (page - 1) * limit;
      const items = filtered.slice(start, start + limit).map(toAdminClubRow);
      return {
        adminClubs: {
          items,
          total: filtered.length,
          hasMore: start + limit < filtered.length,
        },
      };
    },
    staleTime: 60_000,
  });
}

type ClubMutationContext = {
  previous?: ClubsResponse;
};

// GAP backend: adminSetClubVerification está marcado "TODO: backend pendiente"
// en graphql/admin/mutations.ts — contrato documentado, sin confirmar contra
// el schema real.
export function useAdminSetClubVerification() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin.clubs");

  return useMutation<
    { adminSetClubVerification: AdminClubRow },
    Error,
    { clubId: string; status: ClubVerificationStatus },
    ClubMutationContext
  >({
    mutationFn: async (variables) =>
      graphqlClient.request(ADMIN_SET_CLUB_VERIFICATION, variables),

    onMutate: async ({ clubId, status }) => {
      await queryClient.cancelQueries({ queryKey: ADMIN_CLUBS_KEY });

      const previous = queryClient.getQueryData<ClubsResponse>(ADMIN_CLUBS_KEY);

      queryClient.setQueryData<ClubsResponse>(ADMIN_CLUBS_KEY, (old) => {
        if (!old) return old;
        return {
          clubs: old.clubs.map((club) =>
            club.id === clubId
              ? { ...club, verificationStatus: status, isVerified: status === "VERIFIED" }
              : club
          ),
        };
      });

      return { previous };
    },

    onSuccess: (_data, { status }) => {
      toast.success(
        status === "VERIFIED"
          ? t("toasts.approved")
          : status === "REJECTED"
            ? t("toasts.rejected")
            : t("toasts.statusUpdated")
      );
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(ADMIN_CLUBS_KEY, context.previous);
      }
      toast.error(t("toasts.actionFailed"));
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_CLUBS_KEY });
    },
  });
}
