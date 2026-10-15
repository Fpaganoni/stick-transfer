import { gql } from "graphql-request";

// ===========================================
// CLUB QUERIES
// ===========================================

/**
 * Everything the club profile renders. No follower counters on purpose: they add
 * seconds to `me`, and the user-level counters of a CLUB account are the same numbers.
 * `managedBy` is private: the backend answers null to anyone but the club and SUPERADMIN.
 */
export const CLUB_PROFILE_FIELDS = `
  id
  name
  logo
  coverImage
  coverImagePosition
  description
  bio
  city
  country
  league
  foundedYear
  benefits
  isVerified
  verificationStatus
  verificationDoc
  managedBy {
    firstName
    lastName
  }
  website
  email
  phone
  instagram
  twitter
  facebook
  tiktok
`;

export const GET_CLUBS = gql`
  query GetClubs($limit: Int, $offset: Int) {
    clubs(limit: $limit, offset: $offset) {
      id
      name
      logo
      coverImage
      description
      city
      country
      league
      isVerified
      user {
        id
        avatar
      }
      # Needed by the "my clubs" tab; resolved for the whole page in one query.
      members {
        id
        status
        user {
          id
        }
      }
    }
  }
`;

export const GET_CLUB = gql`
  query GetClub($id: ID!) {
    club(id: $id) {
      ${CLUB_PROFILE_FIELDS}
      followersCount
      isFollowedByCurrentUser
      user {
        id
        username
        avatar
      }
      members {
        id
        role
        status
        joinedAt
        user {
          id
          username
          name
          avatar
          position
          role
        }
      }
    }
  }
`;
