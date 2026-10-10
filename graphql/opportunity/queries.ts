import { gql } from "graphql-request";

/// ============================================
/// OPPORTUNITIES QUERIES
/// ============================================

/** Everything the opportunity list and the detail modal render. */
const JOB_OPPORTUNITY_FIELDS = `
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
  hasAppliedByCurrentUser
  createdAt
`;

export const GET_JOB_OPPORTUNITIES = gql`
  query {
    jobOpportunities {
      ${JOB_OPPORTUNITY_FIELDS}
    }
  }
`;

export const GET_JOB_OPPORTUNITY = gql`
  query GetJobOpportunity($id: String!) {
    jobOpportunity(id: $id) {
      ${JOB_OPPORTUNITY_FIELDS}
    }
  }
`;

/** Selection of one row of userApplications (also returned by applyForJob). */
export const APPLICATION_FIELDS = `
  id
  jobOpportunityId
  status
  appliedAt
  jobOpportunity {
    id
    title
    city
    country
    salary
    currency
    level
    status
    positionType
    club {
      id
      name
      logo
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
      ${APPLICATION_FIELDS}
    }
  }
`;
