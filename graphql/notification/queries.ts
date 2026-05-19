import { gql } from "graphql-request";

// ============================================
// NOTIFICATION QUERIES
// ============================================

export const GET_NOTIFICATIONS = gql`
  query MyNotifications($userId: ID!, $limit: Int, $offset: Int) {
    myNotifications(userId: $userId, limit: $limit, offset: $offset) {
      id
      type
      isRead
      recipientId
      entityId
      createdAt
      actor {
        id
        name
        username
        avatar
      }
    }
  }
`;

export const GET_UNREAD_NOTIFICATIONS_COUNT = gql`
  query UnreadNotificationsCount($userId: ID!) {
    unreadNotificationsCount(userId: $userId)
  }
`;
