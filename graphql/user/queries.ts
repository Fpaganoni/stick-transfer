import { gql } from "graphql-request";

// ============================================
// SHARED SELECTIONS
// ============================================

// Umpire-only fields. Always safe to select: non-umpires get null / [].
// licenseNumber is private (owner + SUPERADMIN); everyone else receives null.
const UMPIRE_FIELDS = `
      isVerified
      yearsOfExperience
      licenseLevel
      certifyingBody
      licenseNumber
      certificationYear
      matchesOfficiated
      travelAvailability
      languages
      modalities
      umpireCategories
      umpireCertifications {
        id
        name
        issuer
        issuedAt
        fileUrl
        order
      }`;

// ============================================
// USER QUERIES
// ============================================

export const GET_USERS = gql`
  query GetUsers {
    users {
      id
      email
      name
      avatar
      bio
      position
      clubId
      cvUrl
    }
  }
`;

export const ME = gql`
  query Me {
    me {
      id
      email
      name
      username
      avatar
      coverImage
      coverImagePosition
      bio
      position
      role
      clubId
      country
      city
      cvUrl
      multimedia
      ${UMPIRE_FIELDS}
      club {
        name
        logo
      }
      trajectories {
        title
        organization
        period
        description
        startDate
        endDate
        isCurrent
        club {
          name
          logo
        }
      }
    }
  }
`;

export const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      email
      name
      avatar
      coverImage
      coverImagePosition
      bio
      position
      role
      country
      clubId
      cvUrl
      multimedia
      ${UMPIRE_FIELDS}
      club {
        id
        name
        logo
      }
      followers {
        id
        name
        avatar
        username
      }
      following {
        id
        name
        avatar
        username
      }
      trajectories {
        title
        organization
        period
        description
        startDate
        endDate
        isCurrent
        club {
          name
          logo
        }
      }
    }
  }
`;

export const GET_USER_BY_USERNAME = gql`
  query GetUserByUsername($username: String!) {
    getUserByUsername(username: $username) {
      id
      email
      name
      username
      avatar
      coverImage
      coverImagePosition
      bio
      position
      role
      country
      city
      cvUrl
      multimedia
      ${UMPIRE_FIELDS}
      followers {
        id
        name
        avatar
        username
      }
      following {
        id
        name
        avatar
        username
      }
      trajectories {
        title
        organization
        period
        description
        startDate
        endDate
        isCurrent
        club {
          name
          logo
        }
      }
    }
  }
`;

export const EXPLORE_USERS_QUERY = gql`
  query ExploreUsers(
    $searchQuery: String
    $role: String
    $position: String
    $level: String
    $country: String
    $licenseLevel: UmpireLicenseLevel
    $modality: UmpireModality
    $umpireCategory: UmpireCategory
    $limit: Int
    $offset: Int
  ) {
    exploreUsers(
      searchQuery: $searchQuery
      role: $role
      position: $position
      level: $level
      country: $country
      licenseLevel: $licenseLevel
      modality: $modality
      umpireCategory: $umpireCategory
      limit: $limit
      offset: $offset
    ) {
      id
      name
      username
      avatar
      role
      position
      level
      country
      city
      bio
      isVerified
      cvUrl
      licenseLevel
      travelAvailability
      modalities
      umpireCategories
      matchesOfficiated
      club {
        id
        name
        logo
      }
    }
  }
`;
