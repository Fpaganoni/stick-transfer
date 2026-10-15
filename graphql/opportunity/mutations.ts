import { gql } from "graphql-request";
import { APPLICATION_FIELDS } from "./queries";

/// ============================================
/// JOB OPPORTUNITY MUTATIONS
/// ============================================

export const CREATE_JOB_OPPORTUNITY = gql`
  mutation CreateJobOpportunity(
    $title: String!
    $description: String!
    $positionType: String!
    $level: String!
    $country: String!
    $city: String!
    $salary: Float
    $currency: String
    $benefits: String
    $licenseLevelRequired: UmpireLicenseLevel
    $modality: UmpireModality
    $umpireCategory: UmpireCategory
    $matchDate: String
  ) {
    createJobOpportunity(
      title: $title
      description: $description
      positionType: $positionType
      level: $level
      country: $country
      city: $city
      salary: $salary
      currency: $currency
      benefits: $benefits
      licenseLevelRequired: $licenseLevelRequired
      modality: $modality
      umpireCategory: $umpireCategory
      matchDate: $matchDate
    ) {
      id
      title
      description
      positionType
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
      createdAt
      club {
        id
        name
      }
    }
  }
`;

// Both mutations are idempotent on the backend and return a Boolean.
export const SAVE_JOB = gql`
  mutation SaveJobOpportunity($jobOpportunityId: ID!) {
    saveJobOpportunity(jobOpportunityId: $jobOpportunityId)
  }
`;

export const UNSAVE_JOB = gql`
  mutation UnsaveJobOpportunity($jobOpportunityId: ID!) {
    unsaveJobOpportunity(jobOpportunityId: $jobOpportunityId)
  }
`;

/** status: OPEN | CLOSED | FILLED. FILLED stamps filledAt, which starts the deletion cooldown. */
export const UPDATE_JOB_OPPORTUNITY_STATUS = gql`
  mutation UpdateJobOpportunityStatus($id: String!, $status: String!) {
    updateJobOpportunity(id: $id, status: $status) {
      id
      status
      filledAt
    }
  }
`;

/** Rejected with JOB_HAS_UNANSWERED_APPLICATIONS or JOB_FILLED_COOLDOWN while the rules are not met. */
export const DELETE_JOB_OPPORTUNITY = gql`
  mutation DeleteJobOpportunity($id: String!) {
    deleteJobOpportunity(id: $id)
  }
`;

/** status: UNDER_REVIEW | ACCEPTED | REJECTED. */
export const UPDATE_APPLICATION_STATUS = gql`
  mutation UpdateApplicationStatus($applicationId: ID!, $status: String!, $notes: String) {
    updateApplicationStatus(applicationId: $applicationId, status: $status, notes: $notes) {
      id
      jobOpportunityId
      status
      reviewedAt
      notes
    }
  }
`;

export const APPLY_FOR_JOB = gql`
  mutation ApplyForJob(
    $jobOpportunityId: String!
    $userId: String!
    $coverLetter: String
    $resumeUrl: String
  ) {
    applyForJob(
      jobOpportunityId: $jobOpportunityId
      userId: $userId
      coverLetter: $coverLetter
      resumeUrl: $resumeUrl
    ) {
      ${APPLICATION_FIELDS}
      updatedAt
    }
  }
`;
