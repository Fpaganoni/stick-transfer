"use client";

import { useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Briefcase,
  CheckCheck,
  RefreshCw,
  X,
  Trash2,
  Building2,
  BadgeCheck,
  Flag,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useRemoveNotification,
  useClearAllNotifications,
} from "@/hooks/useNotifications";
import { useNotificationsStore } from "@/stores/useNotificationsStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { Notification, NotificationType } from "@/types/models/notification";
import { formatRelativeTime } from "@/lib/date-utils";

const TYPE_ICON: Record<NotificationType, React.ReactNode> = {
  [NotificationType.CLUB_INVITE]: (
    <Briefcase size={12} className="text-warning" />
  ),
  [NotificationType.CLUB_ACCEPT]: (
    <CheckCheck size={12} className="text-success" />
  ),
  [NotificationType.JOB_APPLICATION_UPDATE]: (
    <Briefcase size={12} className="text-primary" />
  ),
  [NotificationType.CLUB_PENDING_VERIFICATION]: (
    <Building2 size={12} className="text-warning" />
  ),
  [NotificationType.CLUB_VERIFIED]: (
    <BadgeCheck size={12} className="text-accent" />
  ),
  [NotificationType.REPORT_RECEIVED]: (
    <Flag size={12} className="text-error" />
  ),
  [NotificationType.NEW_FOLLOWER]: (
    <UserPlus size={12} className="text-primary" />
  ),
};

function resolveNotificationHref(
  notification: Notification,
  locale: string,
): string | null {
  const { type } = notification;

  if (
    type === NotificationType.CLUB_INVITE ||
    type === NotificationType.CLUB_ACCEPT
  ) {
    return `/${locale}/clubs`;
  }

  if (type === NotificationType.CLUB_PENDING_VERIFICATION) {
    return `/${locale}/admin/clubs`;
  }

  if (type === NotificationType.CLUB_VERIFIED) {
    return notification.entityId
      ? `/${locale}/clubs/${notification.entityId}`
      : `/${locale}/clubs`;
  }

  if (type === NotificationType.REPORT_RECEIVED) {
    return `/${locale}/admin/reports`;
  }

  return null;
}

function NotificationItem({ notification }: { notification: Notification }) {
  const markAsRead = useMarkNotificationAsRead();
  const removeNotification = useRemoveNotification();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Notifications");

  const actorName = notification.actor?.name?.trim() || "Someone";
  const typedLocale = locale as "en" | "es" | "fr";

  const handleClick = () => {
    if (!notification.isRead) {
      markAsRead.mutate({ id: notification.id });
    }
    const href = resolveNotificationHref(notification, locale);
    if (href) router.push(href);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    const userId = useAuthStore.getState().user?.id;
    if (userId) {
      removeNotification.mutate({ id: notification.id, userId });
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      className={`relative w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left cursor-pointer group ${
        !notification.isRead ? "bg-primary/5 border-l-2 border-l-primary" : ""
      }`}
    >
      {/* Avatar + type icon badge */}
      <div className="relative shrink-0">
        {notification.actor?.avatar ? (
          <Image
            src={notification.actor.avatar}
            alt={notification.actor.name}
            width={36}
            height={36}
            className="rounded-full object-cover w-9 h-9"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
            {notification.actor?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <span className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5 border border-border">
          {TYPE_ICON[notification.type]}
        </span>
      </div>

      {/* Message + time */}
      <div className="flex-1 min-w-0 pr-6">
        <p className="text-sm text-foreground leading-snug line-clamp-2">
          {t(notification.type, { actorName })}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatRelativeTime(notification.createdAt, typedLocale)}
        </p>
      </div>

      {/* Unread dot */}
      {!notification.isRead && (
        <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
      )}

      {/* Delete button — visible on hover */}
      <button
        onClick={handleRemove}
        disabled={removeNotification.isPending}
        aria-label={t("remove")}
        className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-all disabled:opacity-30 text-muted-foreground hover:text-foreground"
      >
        <X size={12} />
      </button>
    </div>
  );
}

export function NotificationDropdown() {
  const { isOpen, close } = useNotificationsStore();
  const { user } = useAuthStore();
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useNotifications();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const clearAll = useClearAllNotifications();
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("Notifications");

  // Infinite scroll sentinel
  const { ref: sentinelRef, inView } = useInView({ threshold: 0.1 });

  // Load next page when sentinel visible
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Close on outside click
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen, close]);

  // Mark all as read when panel opens
  useEffect(() => {
    if (isOpen && user?.id) {
      const notifications = data?.pages.flatMap((p) => p.myNotifications) ?? [];
      const hasUnread = notifications.some((n) => !n.isRead);
      if (hasUnread) {
        markAllAsRead.mutate({ userId: user.id });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const notifications = data?.pages.flatMap((p) => p.myNotifications) ?? [];
  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div
      ref={containerRef}
      className="fixed sm:absolute right-4 sm:right-0 top-16 sm:top-full sm:mt-2 w-[min(calc(100vw-2rem),320px)] bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="font-semibold text-foreground text-sm">
          {t("title")}
        </span>
        <div className="flex items-center gap-2">
          {hasUnread && (
            <button
              onClick={() =>
                user?.id && markAllAsRead.mutate({ userId: user.id })
              }
              disabled={markAllAsRead.isPending}
              className="text-xs text-primary hover:underline disabled:opacity-50 flex items-center gap-1"
            >
              <CheckCheck size={12} />
              {t("markAllRead")}
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={() => user?.id && clearAll.mutate({ userId: user.id })}
              disabled={clearAll.isPending}
              className="text-xs text-muted-foreground hover:text-destructive hover:underline disabled:opacity-50 flex items-center gap-1 transition-colors"
            >
              <Trash2 size={12} />
              {t("clearAll")}
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="max-h-[420px] overflow-y-auto divide-y divide-border">
        {isLoading && (
          <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
            <RefreshCw size={16} className="animate-spin" />
            <span className="text-sm">{t("loading")}</span>
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Bell size={28} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t("empty")}</span>
          </div>
        )}

        <AnimatePresence initial={false}>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0, overflow: "hidden" }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <NotificationItem notification={notification} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="py-1">
          {isFetchingNextPage && (
            <div className="flex justify-center py-2">
              <RefreshCw
                size={14}
                className="animate-spin text-muted-foreground"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
