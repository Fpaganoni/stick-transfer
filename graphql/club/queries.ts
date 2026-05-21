import { gql } from "graphql-request";

// ===========================================
// CLUB QUERIES
// ===========================================

export const GET_CLUBS = gql`
  query GetClubs {
    clubs {
      id
      name
      logo
      coverImage
      description
      city
      country
      league
      isVerified
      admin {
        avatar
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
