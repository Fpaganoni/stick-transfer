import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import {
  GET_NOTIFICATIONS,
  GET_UNREAD_NOTIFICATIONS_COUNT,
} from "@/graphql/notification/queries";
import {
  MARK_NOTIFICATION_AS_READ,
  MARK_ALL_NOTIFICATIONS_AS_READ,
  REMOVE_NOTIFICATION,
  CLEAR_ALL_NOTIFICATIONS,
} from "@/graphql/notification/mutations";
import {
  NotificationsPage,
  UnreadCountResponse,
  MarkAsReadResponse,
  MarkAllAsReadResponse,
  MarkAsReadVariables,
  MarkAllAsReadVariables,
  RemoveNotificationResponse,
  RemoveNotificationVariables,
  ClearAllNotificationsResponse,
  ClearAllNotificationsVariables,
} from "@/types/models/notification";
import { useAuthStore } from "@/stores/useAuthStore";

type NotificationMutationContext = {
  previousList: InfiniteData<NotificationsPage> | undefined;
  previousCount: UnreadCountResponse | undefined;
};

const PAGE_SIZE = 20;

export function notificationsQueryKey(userId?: string) {
  return ["notifications", userId] as const;
}

export function notificationsCountQueryKey(userId?: string) {
  return ["notifications-count", userId] as const;
}

export function useNotifications() {
  const { user } = useAuthStore();

  return useInfiniteQuery<NotificationsPage>({
    queryKey: notificationsQueryKey(user?.id),
    queryFn: ({ pageParam }) =>
      graphqlClient.request(GET_NOTIFICATIONS, {
        userId: user!.id,
        limit: PAGE_SIZE,
        offset: pageParam as number,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.myNotifications.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });
}

export function useUnreadNotificationsCount() {
  const { user } = useAuthStore();

  return useQuery<UnreadCountResponse>({
    queryKey: notificationsCountQueryKey(user?.id),
    queryFn: () =>
      graphqlClient.request(GET_UNREAD_NOTIFICATIONS_COUNT, {
        userId: user!.id,
      }),
    enabled: !!user?.id,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation<MarkAsReadResponse, Error, MarkAsReadVariables>({
    mutationFn: (variables) =>
      graphqlClient.request(MARK_NOTIFICATION_AS_READ, variables),

    onMutate: async ({ id }) => {
      const listKey = notificationsQueryKey(user?.id);
      const countKey = notificationsCountQueryKey(user?.id);

      await queryClient.cancelQueries({ queryKey: listKey });
      await queryClient.cancelQueries({ queryKey: countKey });

      const previousList = queryClient.getQueryData<InfiniteData<NotificationsPage>>(listKey);
      const previousCount = queryClient.getQueryData<UnreadCountResponse>(countKey);

      queryClient.setQueryData<InfiniteData<NotificationsPage>>(listKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            myNotifications: page.myNotifications.map((n) =>
              n.id === id ? { ...n, isRead: true } : n
            ),
          })),
        };
      });

      queryClient.setQueryData<UnreadCountResponse>(countKey, (old) => {
        if (!old) return old;
        return {
          unreadNotificationsCount: Math.max(0, old.unreadNotificationsCount - 1),
        };
      });

      return { previousList, previousCount };
    },

    onError: (_err, _vars, context: NotificationMutationContext | undefined) => {
      if (context?.previousList) {
        queryClient.setQueryData(notificationsQueryKey(user?.id), context.previousList);
      }
      if (context?.previousCount) {
        queryClient.setQueryData(notificationsCountQueryKey(user?.id), context.previousCount);
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey(user?.id) });
      queryClient.invalidateQueries({ queryKey: notificationsCountQueryKey(user?.id) });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation<MarkAllAsReadResponse, Error, MarkAllAsReadVariables>({
    mutationFn: (variables) =>
      graphqlClient.request(MARK_ALL_NOTIFICATIONS_AS_READ, variables),

    onMutate: async () => {
      const listKey = notificationsQueryKey(user?.id);
      const countKey = notificationsCountQueryKey(user?.id);

      await queryClient.cancelQueries({ queryKey: listKey });
      await queryClient.cancelQueries({ queryKey: countKey });

      const previousList = queryClient.getQueryData<InfiniteData<NotificationsPage>>(listKey);
      const previousCount = queryClient.getQueryData<UnreadCountResponse>(countKey);

      queryClient.setQueryData<InfiniteData<NotificationsPage>>(listKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            myNotifications: page.myNotifications.map((n) => ({ ...n, isRead: true })),
          })),
        };
      });

      queryClient.setQueryData<UnreadCountResponse>(countKey, {
        unreadNotificationsCount: 0,
      });

      return { previousList, previousCount };
    },

    onError: (_err, _vars, context: NotificationMutationContext | undefined) => {
      if (context?.previousList) {
        queryClient.setQueryData(notificationsQueryKey(user?.id), context.previousList);
      }
      if (context?.previousCount) {
        queryClient.setQueryData(notificationsCountQueryKey(user?.id), context.previousCount);
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey(user?.id) });
      queryClient.invalidateQueries({ queryKey: notificationsCountQueryKey(user?.id) });
    },
  });
}

export function useRemoveNotification() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation<RemoveNotificationResponse, Error, RemoveNotificationVariables>({
    mutationFn: (variables) =>
      graphqlClient.request(REMOVE_NOTIFICATION, variables),

    onMutate: async ({ id }) => {
      const listKey = notificationsQueryKey(user?.id);
      const countKey = notificationsCountQueryKey(user?.id);

      await queryClient.cancelQueries({ queryKey: listKey });
      await queryClient.cancelQueries({ queryKey: countKey });

      const previousList = queryClient.getQueryData<InfiniteData<NotificationsPage>>(listKey);
      const previousCount = queryClient.getQueryData<UnreadCountResponse>(countKey);

      let wasUnread = false;

      queryClient.setQueryData<InfiniteData<NotificationsPage>>(listKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => {
            const target = page.myNotifications.find((n) => n.id === id);
            if (target && !target.isRead) wasUnread = true;
            return {
              myNotifications: page.myNotifications.filter((n) => n.id !== id),
            };
          }),
        };
      });

      if (wasUnread) {
        queryClient.setQueryData<UnreadCountResponse>(countKey, (old) => {
          if (!old) return old;
          return {
            unreadNotificationsCount: Math.max(0, old.unreadNotificationsCount - 1),
          };
        });
      }

      return { previousList, previousCount };
    },

    onError: (_err, _vars, context: NotificationMutationContext | undefined) => {
      if (context?.previousList) {
        queryClient.setQueryData(notificationsQueryKey(user?.id), context.previousList);
      }
      if (context?.previousCount) {
        queryClient.setQueryData(notificationsCountQueryKey(user?.id), context.previousCount);
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey(user?.id) });
      queryClient.invalidateQueries({ queryKey: notificationsCountQueryKey(user?.id) });
    },
  });
}

export function useClearAllNotifications() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation<ClearAllNotificationsResponse, Error, ClearAllNotificationsVariables>({
    mutationFn: (variables) =>
      graphqlClient.request(CLEAR_ALL_NOTIFICATIONS, variables),

    onMutate: async () => {
      const listKey = notificationsQueryKey(user?.id);
      const countKey = notificationsCountQueryKey(user?.id);

      await queryClient.cancelQueries({ queryKey: listKey });
      await queryClient.cancelQueries({ queryKey: countKey });

      const previousList = queryClient.getQueryData<InfiniteData<NotificationsPage>>(listKey);
      const previousCount = queryClient.getQueryData<UnreadCountResponse>(countKey);

      queryClient.setQueryData<InfiniteData<NotificationsPage>>(listKey, (old) => {
        if (!old) return old;
        return { ...old, pages: [{ myNotifications: [] }] };
      });

      queryClient.setQueryData<UnreadCountResponse>(countKey, {
        unreadNotificationsCount: 0,
      });

      return { previousList, previousCount };
    },

    onError: (_err, _vars, context: NotificationMutationContext | undefined) => {
      if (context?.previousList) {
        queryClient.setQueryData(notificationsQueryKey(user?.id), context.previousList);
      }
      if (context?.previousCount) {
        queryClient.setQueryData(notificationsCountQueryKey(user?.id), context.previousCount);
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey(user?.id) });
      queryClient.invalidateQueries({ queryKey: notificationsCountQueryKey(user?.id) });
    },
  });
}
