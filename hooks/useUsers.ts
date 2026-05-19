import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import {
  GET_USERS,
  GET_USER,
  GET_USER_BY_USERNAME,
} from "@/graphql/user/queries";
import {
  LOGIN,
  REGISTER,
  UPLOAD_CV,
  DELETE_CV,
  UPDATE_USER,
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
} from "@/types/models/user";
import {
  User,
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
