import { gql } from "graphql-request";

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
