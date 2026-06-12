import { gql } from "graphql-request";

export const GET_REPORTS = gql`
  query Reports($status: ReportStatus, $targetType: ReportTargetType, $page: Int, $limit: Int) {
    reports(status: $status, targetType: $targetType, page: $page, limit: $limit) {
      id
      reporterId
      reporter {
        id
        name
        username
        avatar
      }
      targetType
      targetId
      reason
      description
      status
      reviewedById
      reviewedBy {
        id
        name
        username
        avatar
      }
      reviewedAt
      createdAt
      updatedAt
    }
  }
`;

export const GET_REPORT = gql`
  query Report($id: ID!) {
    report(id: $id) {
      id
      reporterId
      reporter {
        id
        name
        username
        avatar
      }
      targetType
      targetId
      reason
      description
      status
      reviewedById
      reviewedBy {
        id
        name
        username
        avatar
      }
      reviewedAt
      createdAt
      updatedAt
    }
  }
`;
