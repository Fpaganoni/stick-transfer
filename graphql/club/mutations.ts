import { gql } from "graphql-request";

export const CREATE_CLUB = gql`
  mutation CreateClub($input: CreateClubInput!) {
    createClub(input: $input) {
      id
      name
      logo
      city
      country
      isVerified
      verificationStatus
    }
  }
`;

export const VERIFY_CLUB = gql`
  mutation VerifyClub($clubId: ID!) {
    verifyClub(clubId: $clubId) {
      id
      isVerified
      verificationStatus
    }
  }
`;

export const REQUEST_CLUB_VERIFICATION = gql`
  mutation RequestClubVerification($clubId: ID!, $documentUrl: String!) {
    requestClubVerification(clubId: $clubId, documentUrl: $documentUrl) {
      id
      verificationStatus
      isVerified
    }
  }
`;
