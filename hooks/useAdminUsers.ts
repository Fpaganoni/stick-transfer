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

interface UsersResponse {
  users: AdminUserRow[];
}

function applyUserFilters(users: AdminUserRow[], filters?: AdminUserFilters): AdminUserRow[] {
  return users.filter((user) => {
    if (filters?.role && user.role !== filters.role) return false;
    // GAP backend: isActive no existe en User, este filtro no tiene efecto
    // hasta que el backend lo agregue (ver AdminUserRow).
    if (filters?.isActive !== undefined && user.isActive !== filters.isActive) return false;
    if (filters?.isVerified !== undefined && user.isVerified !== filters.isVerified) return false;
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      const haystack = `${user.name} ${user.username} ${user.email}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

// GAP backend: no existe adminUsers/AdminUserFiltersInput — `users` no soporta
// filtros ni paginación. Se trae la lista completa y se filtra/pagina aquí.
export function useAdminUsers(filters?: AdminUserFilters, page = 1, limit = 20) {
  return useQuery<UsersResponse, Error, AdminUsersResponse>({
    queryKey: ADMIN_USERS_KEY,
    queryFn: async () => graphqlClient.request<UsersResponse>(ADMIN_USERS),
    select: (data) => {
      const filtered = applyUserFilters(data.users, filters);
      const start = (page - 1) * limit;
      const items = filtered.slice(start, start + limit);
      return {
        adminUsers: {
          items,
          total: filtered.length,
          hasMore: start + limit < filtered.length,
        },
      };
    },
    staleTime: 60_000,
  });
}

type UserMutationContext = {
  previous?: UsersResponse;
};

function patchUser(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string,
  patch: Partial<AdminUserRow>
): UserMutationContext {
  const previous = queryClient.getQueryData<UsersResponse>(ADMIN_USERS_KEY);

  queryClient.setQueryData<UsersResponse>(ADMIN_USERS_KEY, (old) => {
    if (!old) return old;
    return {
      users: old.users.map((user) => (user.id === userId ? { ...user, ...patch } : user)),
    };
  });

  return { previous };
}

function rollbackUser(
  queryClient: ReturnType<typeof useQueryClient>,
  context: UserMutationContext | undefined
) {
  if (context?.previous) {
    queryClient.setQueryData(ADMIN_USERS_KEY, context.previous);
  }
}

export function useAdminSetUserActive() {
  const queryClient = useQueryClient();
  const t = useTranslations("admin.users");

  return useMutation<
    { adminSetUserActive: AdminUserRow },
    Error,
    { userId: string; active: boolean },
    UserMutationContext
  >({
    mutationFn: async (variables) => graphqlClient.request(ADMIN_SET_USER_ACTIVE, variables),

    onMutate: async ({ userId, active }) => {
      await queryClient.cancelQueries({ queryKey: ADMIN_USERS_KEY });
      return patchUser(queryClient, userId, { isActive: active });
    },

    onSuccess: (_data, { active }) => {
      toast.success(active ? t("toasts.activated") : t("toasts.deactivated"));
    },

    onError: (_err, _vars, context) => {
      rollbackUser(queryClient, context);
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
    { userId: string; verified: boolean },
    UserMutationContext
  >({
    mutationFn: async (variables) => graphqlClient.request(ADMIN_SET_USER_VERIFIED, variables),

    onMutate: async ({ userId, verified }) => {
      await queryClient.cancelQueries({ queryKey: ADMIN_USERS_KEY });
      return patchUser(queryClient, userId, { isVerified: verified });
    },

    onSuccess: (_data, { verified }) => {
      toast.success(verified ? t("toasts.verified") : t("toasts.unverified"));
    },

    onError: (_err, _vars, context) => {
      rollbackUser(queryClient, context);
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
      return patchUser(queryClient, userId, { role });
    },

    onSuccess: () => {
      toast.success(t("toasts.roleChanged"));
    },

    onError: (_err, _vars, context) => {
      rollbackUser(queryClient, context);
      toast.error(t("toasts.actionFailed"));
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_KEY });
    },
  });
}
