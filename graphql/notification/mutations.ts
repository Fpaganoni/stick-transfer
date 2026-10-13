import { gql } from "graphql-request";

// ============================================
// NOTIFICATION MUTATIONS
// ============================================

export const MARK_NOTIFICATION_AS_READ = gql`
  mutation MarkNotificationAsRead($id: ID!) {
    markNotificationAsRead(id: $id)
  }
`;

export const MARK_ALL_NOTIFICATIONS_AS_READ = gql`
  mutation MarkAllNotificationsAsRead($userId: ID!) {
    markAllNotificationsAsRead(userId: $userId)
  }
`;

export const REMOVE_NOTIFICATION = gql`
  mutation RemoveNotification($id: ID!, $userId: ID!) {
    removeNotification(id: $id, userId: $userId)
  }
`;

export const CLEAR_ALL_NOTIFICATIONS = gql`
  mutation ClearAllNotifications($userId: ID!) {
    clearAllNotifications(userId: $userId)
  }
`;
