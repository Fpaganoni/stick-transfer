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

// GAP backend: no existe adminUsers/AdminUserFiltersInput. Backend solo expone
// `users: [User!]!` sin args. Filtrado y paginación se resuelven client-side
// en useAdminUsers. Campos isActive/authProvider tampoco existen en User
// (ver AdminUserRow) — quedan undefined hasta que el backend los agregue.
export const ADMIN_USERS = gql`
  query AdminUsers {
    users {
      id
      name
      email
      username
      avatar
      role
      country
      city
      isVerified
      isEmailVerified
      createdAt
    }
  }
`;

// GAP backend: no existe adminClubs/AdminClubFiltersInput. Backend solo expone
// `clubs: [Club!]!` sin args. Filtrado y paginación se resuelven client-side
// en useAdminClubs. membersCount no existe como campo propio — se deriva de
// members.length.
export const ADMIN_CLUBS = gql`
  query AdminClubs {
    clubs {
      id
      name
      logo
      city
      country
      league
      verificationStatus
      verificationDoc
      isVerified
      createdAt
      members {
        id
      }
    }
  }
`;

// GAP backend: no existe adminJobOpportunities. Se usa jobOpportunities con
// filtros/paginación reales del backend (JobOpportunityFiltersInput). Retorna
// array plano (sin total/hasMore) — ver heurística de paginación en la page.
// expiresAt/applicationsCount no existen en JobOpportunity (ver AdminJobOpportunityRow).
export const ADMIN_JOB_OPPORTUNITIES = gql`
  query AdminJobOpportunities($filters: JobOpportunityFiltersInput, $page: Int, $limit: Int) {
    jobOpportunities(filters: $filters, page: $page, limit: $limit) {
      id
      title
      positionType
      level
      country
      city
      status
      createdAt
      club {
        id
        name
        logo
      }
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
