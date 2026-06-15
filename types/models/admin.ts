import { Role } from "../enums";
import { NewsCategory } from "@/hooks/useNews";

// ============================================
// DASHBOARD STATS — adminDashboardStats
// ============================================

export interface RoleCount {
  role: Role | string;
  count: number;
}

export interface AdminDashboardStats {
  totalUsersCount: number;
  playersCount: number;
  coachesCount: number;
  clubsCount: number;
  superAdminsCount: number;
  activeUsersCount: number;
  verifiedClubsCount: number;
  pendingVerificationClubsCount: number;
  unverifiedClubsCount: number;
  rejectedClubsCount: number;
  openJobsCount: number;
  closedJobsCount: number;
  filledJobsCount: number;
  totalApplicationsCount: number;
  pendingApplicationsCount: number;
  acceptedApplicationsCount: number;
  rejectedApplicationsCount: number;
  totalReportsCount: number;
  pendingReportsCount: number;
  reviewedReportsCount: number;
  actionTakenReportsCount: number;
  publishedNewsCount: number;
  draftNewsCount: number;
  pendingClubMembershipsCount: number;
  activeClubMembershipsCount: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
}

// ============================================
// USERS — adminUsers / adminSetUserActive / adminSetUserVerified / adminChangeUserRole
// ============================================

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  username: string;
  avatar?: string;
  role: Role | string;
  country?: string;
  city?: string;
  isActive: boolean;
  isVerified: boolean;
  isEmailVerified: boolean;
  // GAP backend: User no expone authProvider. Queda undefined hasta que el
  // backend lo agregue; la UI debe tolerar ausencia.
  authProvider?: string;
  createdAt: string;
}

export interface AdminUserFilters {
  role?: Role | string;
  isActive?: boolean;
  isVerified?: boolean;
  search?: string;
}

// ============================================
// CLUBS — adminClubs / adminSetClubVerification
// ============================================

export type ClubVerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

export interface AdminClubRow {
  id: string;
  name: string;
  logo?: string;
  city?: string;
  country?: string;
  league?: string;
  verificationStatus: ClubVerificationStatus;
  verificationDoc?: string;
  isVerified: boolean;
  membersCount: number;
  createdAt: string;
}

export interface AdminClubFilters {
  verificationStatus?: ClubVerificationStatus;
  search?: string;
}

// ============================================
// JOBS — adminJobOpportunities / adminJobApplications (sin scoping por club)
// ============================================

export interface AdminJobFilters {
  status?: string;
  country?: string;
  positionType?: string;
  search?: string;
}

export interface AdminApplicationFilters {
  status?: string;
  search?: string;
}

export interface AdminJobOpportunityRow {
  id: string;
  title: string;
  positionType: string;
  level: string;
  country: string;
  city: string;
  status: string;
  // GAP backend: JobOpportunity no expone expiresAt ni applicationsCount.
  // Quedan undefined hasta que el backend los agregue.
  expiresAt?: string;
  applicationsCount?: number;
  createdAt: string;
  club: { id: string; name: string; logo?: string };
}

export interface AdminJobApplicationRow {
  id: string;
  status: string;
  appliedAt: string;
  user: { id: string; name: string; username: string; avatar?: string };
  jobOpportunity: { id: string; title: string; club: { id: string; name: string } };
}

// ============================================
// NEWS CMS — superAdminNewsArticles / createNewsArticle / updateNewsArticle / ...
// ============================================

export interface RelatedNewsArticle {
  id: string;
  slug: string;
  title: string;
  coverImage?: string;
  category: NewsCategory;
  publishedAt?: string;
}

export interface AdminNewsArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category: NewsCategory;
  isPublished: boolean;
  publishedAt?: string;
  readingTimeMinutes?: number;
  author?: { name: string; avatar?: string };
  relatedArticles?: RelatedNewsArticle[];
}

export interface SuperAdminNewsFilters {
  category?: NewsCategory;
  search?: string;
}

export interface NewsArticleInput {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category: NewsCategory;
  publishedAt?: string;
  readingTimeMinutes?: number;
  authorName?: string;
  authorAvatar?: string;
  relatedSlugs?: string[];
}

// ============================================
// SHARED PAGINATED RESPONSE SHAPES
// ============================================

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  hasMore: boolean;
}

export interface AdminUsersResponse {
  adminUsers: PaginatedResponse<AdminUserRow>;
}

export interface AdminClubsResponse {
  adminClubs: PaginatedResponse<AdminClubRow>;
}

export interface AdminDashboardStatsResponse {
  adminDashboardStats: AdminDashboardStats;
}

export interface SuperAdminNewsResponse {
  superAdminNewsArticles: PaginatedResponse<AdminNewsArticle>;
}
