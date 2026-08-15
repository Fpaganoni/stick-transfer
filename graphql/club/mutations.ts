import { gql } from "graphql-request";

export const REQUEST_CLUB_VERIFICATION = gql`
  mutation RequestClubVerification($clubId: ID!, $documentUrl: String!) {
    requestClubVerification(clubId: $clubId, documentUrl: $documentUrl) {
      id
      verificationStatus
      isVerified
    }
  }
`;
