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

export function useAdminClubs(filters?: AdminClubFilters, page = 1, limit = 20) {
  return useQuery<AdminClubsResponse>({
    queryKey: [...ADMIN_CLUBS_KEY, filters, page],
    queryFn: async () =>
      graphqlClient.request<AdminClubsResponse>(ADMIN_CLUBS, { filters, page, limit }),
    staleTime: 60_000,
  });
}

type ClubMutationContext = {
  previousLists?: [readonly unknown[], AdminClubsResponse | undefined][];
};

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

      const previousLists = queryClient.getQueriesData<AdminClubsResponse>({
        queryKey: ADMIN_CLUBS_KEY,
      });

      queryClient.setQueriesData<AdminClubsResponse>({ queryKey: ADMIN_CLUBS_KEY }, (old) => {
        if (!old) return old;
        return {
          adminClubs: {
            ...old.adminClubs,
            items: old.adminClubs.items.map((item) =>
              item.id === clubId
                ? { ...item, verificationStatus: status, isVerified: status === "VERIFIED" }
                : item
            ),
          },
        };
      });

      return { previousLists };
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
      context?.previousLists?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toast.error(t("toasts.actionFailed"));
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_CLUBS_KEY });
    },
  });
}
