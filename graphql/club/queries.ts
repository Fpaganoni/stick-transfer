import { gql } from "graphql-request";

// ===========================================
// CLUB QUERIES
// ===========================================

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
      id
      name
      logo
      coverImage
      description
      city
      country
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
