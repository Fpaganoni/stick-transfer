import { gql } from "graphql-request";

/// ============================================
/// OPPORTUNITIES QUERIES
/// ============================================

export const GET_JOB_OPPORTUNITIES = gql`
  query {
    jobOpportunities {
      id
      title
      description
      positionType
      club {
        id
        name
        city
        country
        isVerified
      }
      level
      country
      city
      salary
      currency
      benefits
      status
      createdAt
    }
  }
`;

export const GET_USER_APPLICATIONS = gql`
  query GetUserApplications($userId: String!) {
    userApplications(userId: $userId) {
      id
      jobOpportunityId
      status
      appliedAt
    }
  }
`;
