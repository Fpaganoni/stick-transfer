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
    logo
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
  filledAt
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

/**
 * The vacancies of one club, filtered by the backend. One page of up to 100:
 * a club does not publish more than that at once.
 */
export const GET_CLUB_JOB_OPPORTUNITIES = gql`
  query GetClubJobOpportunities($clubId: ID!, $status: String, $limit: Int) {
    jobOpportunities(filters: { clubId: $clubId, status: $status }, limit: $limit) {
      ${JOB_OPPORTUNITY_FIELDS}
    }
  }
`;

/** Applicants of one vacancy. Owning club or SUPERADMIN only. */
export const GET_JOB_APPLICATIONS = gql`
  query GetJobApplications($jobOpportunityId: String!, $limit: Int) {
    jobApplications(jobOpportunityId: $jobOpportunityId, limit: $limit) {
      id
      jobOpportunityId
      userId
      status
      coverLetter
      resumeUrl
      appliedAt
      reviewedAt
      notes
      user {
        id
        name
        username
        avatar
        role
        position
        country
        city
      }
    }
  }
`;

/**
 * Applications still waiting for an answer (PENDING and UNDER_REVIEW) across all
 * the vacancies of a club, in one request. Used to know which vacancy can be deleted.
 */
export const GET_CLUB_UNANSWERED_APPLICATIONS = gql`
  query GetClubUnansweredApplications($clubId: ID!, $limit: Int) {
    pending: getClubApplications(clubId: $clubId, status: "PENDING", limit: $limit) {
      id
      jobOpportunity {
        id
      }
    }
    underReview: getClubApplications(clubId: $clubId, status: "UNDER_REVIEW", limit: $limit) {
      id
      jobOpportunity {
        id
      }
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
