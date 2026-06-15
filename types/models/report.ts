export type ReportTargetType =
  | "USER"
  | "CLUB"
  | "POST"
  | "JOB_OPPORTUNITY"
  | "MESSAGE"
  | "NEWS_ARTICLE";

export type ReportReason =
  | "SPAM"
  | "HARASSMENT"
  | "INAPPROPRIATE_CONTENT"
  | "FAKE_PROFILE"
  | "SCAM"
  | "OTHER";

export type ReportStatus = "PENDING" | "REVIEWED" | "ACTION_TAKEN" | "DISMISSED";

export interface ReportReporter {
  id: string;
  name: string;
  username: string;
  avatar?: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reporter: ReportReporter;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  reviewedById?: string;
  reviewedBy?: ReportReporter;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportFilters {
  status?: ReportStatus;
  targetType?: ReportTargetType;
}

export interface ReportsResponse {
  reports: Report[];
}

export interface ReportResponse {
  report: Report;
}

export interface UpdateReportStatusResponse {
  updateReportStatus: Report;
}
