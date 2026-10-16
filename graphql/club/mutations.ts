import { gql } from "graphql-request";
import { CLUB_PROFILE_FIELDS } from "./queries";

/**
 * One transaction saves the club identity (name, username, bio, crest, cover,
 * place) and the club data.
 */
export const UPDATE_CLUB = gql`
  mutation UpdateClub(
    $id: ID!
    $name: String
    $username: String
    $bio: String
    $description: String
    $league: String
    $foundedYear: Int
    $benefits: [String!]
    $city: String
    $country: String
    $logo: String
    $coverImage: String
    $coverImagePosition: String
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
      username: $username
      bio: $bio
      description: $description
      league: $league
      foundedYear: $foundedYear
      benefits: $benefits
      city: $city
      country: $country
      logo: $logo
      coverImage: $coverImage
      coverImagePosition: $coverImagePosition
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
      ${CLUB_PROFILE_FIELDS}
      user {
        id
        username
        name
        avatar
        coverImage
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
