import { gql } from "graphql-request";

export const CREATE_REPORT = gql`
  mutation CreateReport(
    $targetType: ReportTargetType!
    $targetId: String!
    $reason: String!
    $description: String
  ) {
    createReport(
      targetType: $targetType
      targetId: $targetId
      reason: $reason
      description: $description
    ) {
      id
      targetType
      targetId
      reason
      status
      createdAt
    }
  }
`;

export const UPDATE_REPORT_STATUS = gql`
  mutation UpdateReportStatus($id: ID!, $status: ReportStatus!) {
    updateReportStatus(id: $id, status: $status) {
      id
      status
      reviewedById
      reviewedBy {
        id
        name
        username
        avatar
      }
      reviewedAt
    }
  }
`;
