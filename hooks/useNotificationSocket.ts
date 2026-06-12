"use client";

import { useEffect } from "react";
import { useQueryClient, InfiniteData } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/useAuthStore";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket-client";
import { notificationsQueryKey, notificationsCountQueryKey } from "@/hooks/useNotifications";
import { Notification, NotificationsPage, UnreadCountResponse, NotificationType } from "@/types/models/notification";

function getToastIcon(type: Notification["type"]): string {
  const icons: Record<NotificationType, string> = {
    [NotificationType.CLUB_INVITE]: "🏑",
    [NotificationType.CLUB_ACCEPT]: "✅",
    [NotificationType.JOB_APPLICATION_UPDATE]: "💼",
    [NotificationType.CLUB_PENDING_VERIFICATION]: "🏟️",
    [NotificationType.CLUB_VERIFIED]: "🏅",
    [NotificationType.REPORT_RECEIVED]: "🚩",
  };
  return icons[type] ?? "🔔";
}

export function useNotificationSocket() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    connectSocket(user.id);
    const socket = getSocket();

    function handleNotification(notification: Notification) {
      toast(`${getToastIcon(notification.type)} ${notification.type}`, {
        duration: 4000,
      });

      // Prepend to first page of infinite list
      queryClient.setQueryData<InfiniteData<NotificationsPage>>(
        notificationsQueryKey(user!.id),
        (old) => {
          if (!old) return old;
          const [firstPage, ...rest] = old.pages;
          return {
            ...old,
            pages: [
              {
                myNotifications: [notification, ...(firstPage?.myNotifications ?? [])],
              },
              ...rest,
            ],
          };
        }
      );

      // Increment unread count
      queryClient.setQueryData<UnreadCountResponse>(
        notificationsCountQueryKey(user!.id),
        (old) => ({
          unreadNotificationsCount: (old?.unreadNotificationsCount ?? 0) + 1,
        })
      );
    }

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
      disconnectSocket();
    };
  }, [user, queryClient]);
}
