import {
  QueryClient,
  QueryKey,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  GET_USERS,
  GET_USER,
  GET_USER_BY_USERNAME,
  GET_USER_FOLLOWERS,
  GET_USER_FOLLOWING,
  ME,
} from "@/graphql/user/queries";
import {
  LOGIN,
  REGISTER,
  UPLOAD_CV,
  DELETE_CV,
  UPDATE_USER,
  FOLLOW_USER,
  UNFOLLOW_USER,
} from "@/graphql/user/mutations";
import {
  LoginVariables,
  LoginResponse,
  RegisterVariables,
  RegisterResponse,
  UploadCvVariables,
  UploadCvResponse,
  DeleteCvVariables,
  DeleteCvResponse,
  UpdateUserVariables,
  FollowVariables,
  FollowResponse,
  UnfollowResponse,
  User,
  UserBasicInfo,
} from "@/types/models/user";


/**
 * Hook to fetch all users
 */
export function useUsers() {
  return useQuery<{ users: User[] }>({
    queryKey: ["users"],
    queryFn: async () => graphqlClient.request(GET_USERS),
  });
}

/**
 * Hook to fetch a single user by ID
 */
export function useUser(userId: string | null) {
  return useQuery<{ user: User }>({
    queryKey: ["user", userId],
    queryFn: async () => graphqlClient.request(GET_USER, { id: userId }),
    // Only run query if userId is provided
    enabled: !!userId,
  });
}

/**
 * Hook to fetch the currently authenticated user.
 * Resolved server-side from the JWT (no id passed) — safe source of
 * truth for role-gated UI, unlike the persisted auth store.
 */
export function useMe() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery<{ me: User }>({
    queryKey: ["me"],
    queryFn: async () => graphqlClient.request(ME),
    enabled: isLoggedIn,
    retry: false,
  });
}

/**
 * Hook to fetch a user by username
 */
export function useUserByUsername(username: string | null) {
  return useQuery<{ getUserByUsername: User }>({
    queryKey: ["user", "username", username],
    queryFn: async () =>
      graphqlClient.request(GET_USER_BY_USERNAME, { username }),
    enabled: !!username,
  });
}

/* login user */

export function useUserLogin() {
  return useMutation<LoginResponse, Error, LoginVariables>({
    mutationFn: async (variables) => graphqlClient.request(LOGIN, variables),
  });
}

/**
 * Register user
 */
export function useUserRegister() {
  return useMutation<RegisterResponse, Error, RegisterVariables>({
    mutationFn: async (variables) => graphqlClient.request(REGISTER, variables),
  });
}

/**
 * Update user profile
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation<{ updateUser: User }, Error, UpdateUserVariables>({
    mutationFn: async (variables) =>
      graphqlClient.request(UPDATE_USER, variables),
    onSuccess: (data) => {
      if (data?.updateUser?.id) {
        queryClient.invalidateQueries({ queryKey: ["user", data.updateUser.id] });
      }
      queryClient.invalidateQueries({ queryKey: ["users"] });
      // We could also invalidate the current authenticated user query if there is one
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

/**
 * Example usage in a component:
 *
 * function UserList() {
 *   const { data, isLoading, error } = useUsers();
 *
 *   if (isLoading) return <div>Loading users...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return (
 *     <div>
 *       {data?.users.map(user => (
 *         <div key={user.id}>{user.name}</div>
 *       ))}
 *     </div>
 *   );
 * }
 */



// ==================
// CV
// ==================

export function useUploadCv() {
  const queryClient = useQueryClient();
  return useMutation<UploadCvResponse, Error, UploadCvVariables>({
    mutationFn: async (variables) =>
      graphqlClient.request(UPLOAD_CV, variables),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user", variables.userId] });
    },
  });
}

export function useDeleteCv() {
  const queryClient = useQueryClient();
  return useMutation<DeleteCvResponse, Error, DeleteCvVariables>({
    mutationFn: async (variables) =>
      graphqlClient.request(DELETE_CV, variables),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user", variables.userId] });
    },
  });
}

// ==================
// FOLLOW / UNFOLLOW
// ==================

/** The followers modal shows the first page only; followersCount is the total. */
export const FOLLOW_LIST_LIMIT = 50;

export type FollowListMode = "followers" | "following";

/**
 * First page of a user's followers or following (users and clubs). Meant for
 * the followers modal: pass enabled only while it is open.
 */
export function useFollowList({
  userId,
  mode,
  enabled,
}: {
  userId: string;
  mode: FollowListMode;
  enabled: boolean;
}) {
  return useQuery<UserBasicInfo[]>({
    queryKey: ["followList", mode, userId],
    queryFn: async () => {
      const variables = { entityType: "USER", entityId: userId, limit: FOLLOW_LIST_LIMIT };
      if (mode === "followers") {
        const data = await graphqlClient.request<{ followers: UserBasicInfo[] }>(
          GET_USER_FOLLOWERS,
          variables,
        );
        return data.followers;
      }
      const data = await graphqlClient.request<{ following: UserBasicInfo[] }>(
        GET_USER_FOLLOWING,
        variables,
      );
      return data.following;
    },
    enabled: enabled && !!userId,
  });
}

type FollowSnapshot = Array<[QueryKey, unknown]>;

/** Any cached profile payload: {user}, {getUserByUsername} or {me}. */
type ProfileQueryData = Record<string, User | null | undefined>;

const PROFILE_FIELDS = ["user", "getUserByUsername"] as const;

function patchFollowedProfile(data: unknown, targetId: string, follow: boolean) {
  if (!data || typeof data !== "object") return data;
  const profileData = data as ProfileQueryData;
  let changed = false;
  const next: ProfileQueryData = { ...profileData };
  for (const field of PROFILE_FIELDS) {
    const profile = profileData[field];
    if (!profile || profile.id !== targetId) continue;
    if (Boolean(profile.isFollowedByCurrentUser) === follow) continue;
    next[field] = {
      ...profile,
      isFollowedByCurrentUser: follow,
      followersCount: Math.max(0, (profile.followersCount ?? 0) + (follow ? 1 : -1)),
    };
    changed = true;
  }
  return changed ? next : data;
}

/**
 * Optimistic follow / unfollow: flips the button and the followers counter of
 * every cached copy of the target profile, and the own followingCount. Returns
 * the previous cache so onError can roll back. A target already in the desired
 * state is left untouched so a double click never counts twice.
 */
async function applyOptimisticFollow(
  queryClient: QueryClient,
  { followerId, followingId }: FollowVariables,
  follow: boolean,
): Promise<FollowSnapshot> {
  await Promise.all([
    queryClient.cancelQueries({ queryKey: ["user"] }),
    queryClient.cancelQueries({ queryKey: ["me"] }),
  ]);
  const snapshot: FollowSnapshot = [
    ...queryClient.getQueriesData({ queryKey: ["user"] }),
    ...queryClient.getQueriesData({ queryKey: ["me"] }),
  ];

  const wasFollowing = queryClient
    .getQueriesData<ProfileQueryData>({ queryKey: ["user"] })
    .some(([, data]) =>
      PROFILE_FIELDS.some(
        (field) =>
          data?.[field]?.id === followingId && data[field]?.isFollowedByCurrentUser === follow,
      ),
    );

  queryClient.setQueriesData({ queryKey: ["user"] }, (data: unknown) =>
    patchFollowedProfile(data, followingId, follow),
  );

  if (!wasFollowing) {
    queryClient.setQueryData<{ me: User }>(["me"], (data) =>
      data?.me?.id === followerId
        ? {
            ...data,
            me: {
              ...data.me,
              followingCount: Math.max(0, (data.me.followingCount ?? 0) + (follow ? 1 : -1)),
            },
          }
        : data,
    );
  }

  return snapshot;
}

function restoreSnapshot(queryClient: QueryClient, snapshot: FollowSnapshot | undefined) {
  snapshot?.forEach(([key, data]) => queryClient.setQueryData(key, data));
}

function invalidateFollowQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["user"] });
  queryClient.invalidateQueries({ queryKey: ["me"] });
  queryClient.invalidateQueries({ queryKey: ["followList"] });
}

export function useFollow() {
  const queryClient = useQueryClient();
  return useMutation<FollowResponse, Error, FollowVariables, FollowSnapshot>({
    mutationFn: (variables) => graphqlClient.request(FOLLOW_USER, variables),
    onMutate: (variables) => applyOptimisticFollow(queryClient, variables, true),
    onError: (_error, _variables, snapshot) => restoreSnapshot(queryClient, snapshot),
    onSettled: () => invalidateFollowQueries(queryClient),
  });
}

export function useUnfollow() {
  const queryClient = useQueryClient();
  return useMutation<UnfollowResponse, Error, FollowVariables, FollowSnapshot>({
    mutationFn: (variables) => graphqlClient.request(UNFOLLOW_USER, variables),
    onMutate: (variables) => applyOptimisticFollow(queryClient, variables, false),
    onError: (_error, _variables, snapshot) => restoreSnapshot(queryClient, snapshot),
    onSettled: () => invalidateFollowQueries(queryClient),
  });
}
