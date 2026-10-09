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
      licenseLevelRequired
      modality
      umpireCategory
      matchDate
      isSavedByCurrentUser
      createdAt
    }
  }
`;

export const GET_SAVED_JOBS = gql`
  query GetSavedJobs {
    savedJobOpportunities(limit: 100) {
      id
      title
      description
      positionType
      club {
        id
        name
        city
        country
        logo
        isVerified
      }
      level
      country
      city
      salary
      currency
      benefits
      status
      licenseLevelRequired
      modality
      umpireCategory
      matchDate
      isSavedByCurrentUser
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
