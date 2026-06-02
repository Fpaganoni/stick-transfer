import { gql } from "graphql-request";

// ============================================
// USER MUTATIONS
// ============================================

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password)
  }
`;

export const REGISTER = gql`
  mutation Register(
    $email: String!
    $name: String!
    $username: String!
    $password: String!
    $role: String!
  ) {
    register(
      email: $email
      name: $name
      username: $username
      password: $password
      role: $role
    )
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser(
    $id: ID!
    $name: String
    $username: String
    $bio: String
    $avatar: String
    $coverImage: String
    $coverImagePosition: String
    $position: String
    $clubId: ID
    $cvUrl: String
    $multimedia: [String!]
    $country: String
    $city: String
    $yearsOfExperience: Int
    $trajectories: [TrajectoryInput!]
  ) {
    updateUser(
      id: $id
      name: $name
      username: $username
      bio: $bio
      avatar: $avatar
      coverImage: $coverImage
      coverImagePosition: $coverImagePosition
      position: $position
      clubId: $clubId
      cvUrl: $cvUrl
      multimedia: $multimedia
      country: $country
      city: $city
      yearsOfExperience: $yearsOfExperience
      trajectories: $trajectories
    ) {
      id
      name
      bio
      avatar
      coverImage
      coverImagePosition
      position
      clubId
      cvUrl
      multimedia
      country
      city
      yearsOfExperience
      trajectories {
        title
        organization
        period
        description
        startDate
        endDate
        isCurrent
      }
    }
  }
`;

// ============================================
// FOLLOW MUTATIONS
// ============================================

export const FOLLOW_USER = gql`
  mutation Follow(
    $followerType: String!
    $followerId: String!
    $followingType: String!
    $followingId: String!
  ) {
    follow(
      followerType: $followerType
      followerId: $followerId
      followingType: $followingType
      followingId: $followingId
    ) {
      id
      followerId
      followingId
    }
  }
`;

export const UNFOLLOW_USER = gql`
  mutation Unfollow(
    $followerType: String!
    $followerId: String!
    $followingType: String!
    $followingId: String!
  ) {
    unfollow(
      followerType: $followerType
      followerId: $followerId
      followingType: $followingType
      followingId: $followingId
    )
  }
`;

// ============================================
// CV MUTATIONS
// ============================================

export const UPLOAD_CV = gql`
  mutation UploadCV($userId: ID!, $base64: String!) {
    uploadCV(userId: $userId, base64: $base64)
  }
`;

export const DELETE_CV = gql`
  mutation DeleteCV($userId: ID!) {
    deleteCV(userId: $userId)
  }
`;
