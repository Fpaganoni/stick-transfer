import { User } from "./user";

export enum NotificationType {
  CLUB_INVITE = "CLUB_INVITE",
  CLUB_ACCEPT = "CLUB_ACCEPT",
  JOB_APPLICATION_UPDATE = "JOB_APPLICATION_UPDATE",
  CLUB_PENDING_VERIFICATION = "CLUB_PENDING_VERIFICATION",
  CLUB_VERIFIED = "CLUB_VERIFIED",
  REPORT_RECEIVED = "REPORT_RECEIVED",
}

export interface Notification {
  id: string;
  type: NotificationType;
  isRead: boolean;
  recipientId: string;
  entityId?: string;
  actor?: User;
  createdAt: string;
}

export interface NotificationsPage {
  myNotifications: Notification[];
}

export interface UnreadCountResponse {
  unreadNotificationsCount: number;
}

export interface MarkAsReadResponse {
  markNotificationAsRead: Pick<Notification, "id" | "isRead">;
}

export interface MarkAllAsReadResponse {
  markAllNotificationsAsRead: boolean;
}

export type MarkAsReadVariables = { id: string };
export type MarkAllAsReadVariables = { userId: string };

export interface RemoveNotificationResponse {
  removeNotification: boolean;
}
export type RemoveNotificationVariables = { id: string; userId: string };

export interface ClearAllNotificationsResponse {
  clearAllNotifications: boolean;
}
export type ClearAllNotificationsVariables = { userId: string };
