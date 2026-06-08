import { gql } from "graphql-request";

// ============================================
// USERS — TODO: backend pendiente, contrato documentado
// ============================================

export const ADMIN_SET_USER_ACTIVE = gql`
  mutation AdminSetUserActive($userId: ID!, $isActive: Boolean!) {
    adminSetUserActive(userId: $userId, isActive: $isActive) {
      id
      isActive
    }
  }
`;

export const ADMIN_SET_USER_VERIFIED = gql`
  mutation AdminSetUserVerified($userId: ID!, $isVerified: Boolean!) {
    adminSetUserVerified(userId: $userId, isVerified: $isVerified) {
      id
      isVerified
    }
  }
`;

export const ADMIN_CHANGE_USER_ROLE = gql`
  mutation AdminChangeUserRole($userId: ID!, $role: Role!) {
    adminChangeUserRole(userId: $userId, role: $role) {
      id
      role
    }
  }
`;

// ============================================
// CLUBS — TODO: backend pendiente, contrato documentado
// ============================================

export const ADMIN_SET_CLUB_VERIFICATION = gql`
  mutation AdminSetClubVerification($clubId: ID!, $status: VerificationStatus!) {
    adminSetClubVerification(clubId: $clubId, status: $status) {
      id
      verificationStatus
      isVerified
    }
  }
`;

// ============================================
// JOBS — TODO: backend pendiente, spec documentada (sin scoping por club)
// ============================================

export const ADMIN_UPDATE_APPLICATION_STATUS = gql`
  mutation AdminUpdateApplicationStatus($id: ID!, $status: ApplicationStatus!) {
    updateApplicationStatus(id: $id, status: $status) {
      id
      status
    }
  }
`;

// ============================================
// NEWS CMS — ya implementado en el backend (requireSuperAdmin)
// ============================================

export const CREATE_NEWS_ARTICLE = gql`
  mutation CreateNewsArticle($input: NewsArticleInput!) {
    createNewsArticle(input: $input) {
      id
      slug
      title
      isPublished
    }
  }
`;

export const UPDATE_NEWS_ARTICLE = gql`
  mutation UpdateNewsArticle($id: ID!, $input: NewsArticleInput!) {
    updateNewsArticle(id: $id, input: $input) {
      id
      slug
      title
      isPublished
    }
  }
`;

export const DELETE_NEWS_ARTICLE = gql`
  mutation DeleteNewsArticle($id: ID!) {
    deleteNewsArticle(id: $id) {
      id
    }
  }
`;

export const PUBLISH_NEWS_ARTICLE = gql`
  mutation PublishNewsArticle($id: ID!) {
    publishNewsArticle(id: $id) {
      id
      isPublished
      publishedAt
    }
  }
`;

export const UNPUBLISH_NEWS_ARTICLE = gql`
  mutation UnpublishNewsArticle($id: ID!) {
    unpublishNewsArticle(id: $id) {
      id
      isPublished
    }
  }
`;
