import { gql } from "graphql-request";

export const ADMIN_DASHBOARD_STATS = gql`
  query AdminDashboardStats {
    adminDashboardStats {
      totalUsersCount
      playersCount
      coachesCount
      clubsCount
      superAdminsCount
      activeUsersCount
      verifiedClubsCount
      pendingVerificationClubsCount
      unverifiedClubsCount
      rejectedClubsCount
      openJobsCount
      closedJobsCount
      filledJobsCount
      totalApplicationsCount
      pendingApplicationsCount
      acceptedApplicationsCount
      rejectedApplicationsCount
      totalReportsCount
      pendingReportsCount
      reviewedReportsCount
      actionTakenReportsCount
      publishedNewsCount
      draftNewsCount
      pendingClubMembershipsCount
      activeClubMembershipsCount
      newUsersLast7Days
      newUsersLast30Days
    }
  }
`;

// TODO: backend pendiente — contrato documentado, endpoint aún no expuesto
export const ADMIN_USERS = gql`
  query AdminUsers($filters: AdminUserFiltersInput, $page: Int, $limit: Int) {
    adminUsers(filters: $filters, page: $page, limit: $limit) {
      items {
        id
        name
        email
        username
        avatar
        role
        country
        city
        isActive
        isVerified
        isEmailVerified
        authProvider
        createdAt
      }
      total
      hasMore
    }
  }
`;

// TODO: backend pendiente — contrato documentado, endpoint aún no expuesto
export const ADMIN_CLUBS = gql`
  query AdminClubs($filters: AdminClubFiltersInput, $page: Int, $limit: Int) {
    adminClubs(filters: $filters, page: $page, limit: $limit) {
      items {
        id
        name
        logo
        city
        country
        league
        verificationStatus
        verificationDoc
        isVerified
        membersCount
        createdAt
      }
      total
      hasMore
    }
  }
`;

// TODO: backend pendiente — vista admin sin scoping por club, spec documentada
export const ADMIN_JOB_OPPORTUNITIES = gql`
  query AdminJobOpportunities($filters: AdminJobFiltersInput, $page: Int, $limit: Int) {
    adminJobOpportunities(filters: $filters, page: $page, limit: $limit) {
      items {
        id
        title
        positionType
        level
        country
        city
        status
        expiresAt
        applicationsCount
        createdAt
        club {
          id
          name
          logo
        }
      }
      total
      hasMore
    }
  }
`;

// TODO: backend pendiente — vista admin sin scoping por club, spec documentada
export const ADMIN_JOB_APPLICATIONS = gql`
  query AdminJobApplications($filters: AdminApplicationFiltersInput, $page: Int, $limit: Int) {
    adminJobApplications(filters: $filters, page: $page, limit: $limit) {
      items {
        id
        status
        appliedAt
        user {
          id
          name
          username
          avatar
        }
        jobOpportunity {
          id
          title
          club {
            id
            name
          }
        }
      }
      total
      hasMore
    }
  }
`;

export const SUPER_ADMIN_NEWS_ARTICLES = gql`
  query SuperAdminNewsArticles($filters: NewsFiltersInput, $page: Int, $limit: Int) {
    superAdminNewsArticles(filters: $filters, page: $page, limit: $limit) {
      items {
        id
        slug
        title
        excerpt
        content
        coverImage
        category
        isPublished
        publishedAt
        readingTimeMinutes
        author {
          name
          avatar
        }
        relatedArticles {
          id
          slug
          title
          coverImage
          category
          publishedAt
        }
      }
      total
      hasMore
    }
  }
`;
