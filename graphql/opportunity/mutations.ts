import { gql } from "graphql-request";

/// ============================================
/// JOB OPPORTUNITY MUTATIONS
/// ============================================

export const CREATE_JOB_OPPORTUNITY = gql`
  mutation CreateJobOpportunity(
    $title: String!
    $description: String!
    $positionType: String!
    $level: String
    $country: String
    $city: String
    $salary: Float
    $currency: String
    $benefits: [String!]
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
      id
      status
      appliedAt
      updatedAt
    }
  }
`;
