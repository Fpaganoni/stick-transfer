import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import {
  ADMIN_USERS,
  ADMIN_SET_USER_ACTIVE,
  ADMIN_SET_USER_VERIFIED,
  ADMIN_CHANGE_USER_ROLE,
} from "@/graphql";
import { AdminUserFilters, AdminUserRow, AdminUsersResponse } from "@/types/models/admin";
import { Role } from "@/types/enums";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

const ADMIN_USERS_KEY = ["admin", "users"] as const;

export function useAdminUsers(filters?: AdminUserFilters, page = 1, limit = 20) {
  return useQuery<AdminUsersResponse>({
    queryKey: [...ADMIN_USERS_KEY, filters, page],
    queryFn: async () =>
      graphqlClient.request<AdminUsersResponse>(ADMIN_USERS, { filters, page, limit }),
    staleTime: 60_000,
  });
}

type UserMutationContext = {
  previousLists?: [readonly unknown[], AdminUsersResponse | undefined][];
};

function patchUserInLists(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string,
  patch: Partial<AdminUserRow>
): UserMutationContext {
  const previousLists = queryClient.getQueriesData<AdminUsersResponse>({
    queryKey: ADMIN_USERS_KEY,
  });

  queryClient.setQueriesData<AdminUsersResponse>({ queryKey: ADMIN_USERS_KEY }, (old) => {
    if (!old) return old;
    return {
      adminUsers: {
        ...old.adminUsers,
        items: old.adminUsers.items.map((item) =>
          item.id === userId ? { ...item, ...patch } : item
        ),
      },
    };
  });

  return { previousLists };
}

function rollbackUserLists(
  queryClient: ReturnType<typeof useQueryClient>,
  context: UserMutationContext | undefined
) {
  context?.previousLists?.forEach(([key, data]) => {
    queryClient.setQueryData(key, data);
  });
}

export function useAdminSetUserActive() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin.users");

  return useMutation<
    { adminSetUserActive: AdminUserRow },
    Error,
    { userId: string; isActive: boolean },
    UserMutationContext
  >({
    mutationFn: async (variables) => graphqlClient.request(ADMIN_SET_USER_ACTIVE, variables),

    onMutate: async ({ userId, isActive }) => {
      await queryClient.cancelQueries({ queryKey: ADMIN_USERS_KEY });
      return patchUserInLists(queryClient, userId, { isActive });
    },

    onSuccess: (_data, { isActive }) => {
      toast.success(isActive ? t("toasts.activated") : t("toasts.deactivated"));
    },

    onError: (_err, _vars, context) => {
      rollbackUserLists(queryClient, context);
      toast.error(t("toasts.actionFailed"));
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_KEY });
    },
  });
}

export function useAdminSetUserVerified() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin.users");

  return useMutation<
    { adminSetUserVerified: AdminUserRow },
    Error,
    { userId: string; isVerified: boolean },
    UserMutationContext
  >({
    mutationFn: async (variables) => graphqlClient.request(ADMIN_SET_USER_VERIFIED, variables),

    onMutate: async ({ userId, isVerified }) => {
      await queryClient.cancelQueries({ queryKey: ADMIN_USERS_KEY });
      return patchUserInLists(queryClient, userId, { isVerified });
    },

    onSuccess: (_data, { isVerified }) => {
      toast.success(isVerified ? t("toasts.verified") : t("toasts.unverified"));
    },

    onError: (_err, _vars, context) => {
      rollbackUserLists(queryClient, context);
      toast.error(t("toasts.actionFailed"));
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_KEY });
    },
  });
}

export function useAdminChangeUserRole() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin.users");

  return useMutation<
    { adminChangeUserRole: AdminUserRow },
    Error,
    { userId: string; role: Role | string },
    UserMutationContext
  >({
    mutationFn: async (variables) => graphqlClient.request(ADMIN_CHANGE_USER_ROLE, variables),

    onMutate: async ({ userId, role }) => {
      await queryClient.cancelQueries({ queryKey: ADMIN_USERS_KEY });
      return patchUserInLists(queryClient, userId, { role });
    },

    onSuccess: () => {
      toast.success(t("toasts.roleChanged"));
    },

    onError: (_err, _vars, context) => {
      rollbackUserLists(queryClient, context);
      toast.error(t("toasts.actionFailed"));
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_KEY });
    },
  });
}
