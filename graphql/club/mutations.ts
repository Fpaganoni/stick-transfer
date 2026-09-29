import { gql } from "graphql-request";

export const UPDATE_CLUB = gql`
  mutation UpdateClub(
    $id: ID!
    $name: String
    $description: String
    $city: String
    $country: String
    $logo: String
    $coverImage: String
    $website: String
    $email: String
    $phone: String
    $instagram: String
    $twitter: String
    $facebook: String
    $tiktok: String
    $managedByFirstName: String
    $managedByLastName: String
  ) {
    updateClub(
      id: $id
      name: $name
      description: $description
      city: $city
      country: $country
      logo: $logo
      coverImage: $coverImage
      website: $website
      email: $email
      phone: $phone
      instagram: $instagram
      twitter: $twitter
      facebook: $facebook
      tiktok: $tiktok
      managedByFirstName: $managedByFirstName
      managedByLastName: $managedByLastName
    ) {
      id
      name
      description
      city
      country
      logo
      coverImage
      website
      email
      phone
      instagram
      twitter
      facebook
      tiktok
      managedBy {
        firstName
        lastName
      }
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
