import { User } from "./user";
import { JobOpportunity } from "./job-opportunity";
import { Club } from "./club";

export type ApplicationStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN";

export interface JobApplication {
  id: string;
  jobOpportunityId: string;
  userId: string;
  status: ApplicationStatus;
  coverLetter?: string;
  resumeUrl?: string;
  appliedAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;

  // Relations
  user?: User;
  jobOpportunity?: JobOpportunity;
}

export type CreateJobApplicationInput = Pick<
  JobApplication,
  "jobOpportunityId" | "userId" | "coverLetter" | "resumeUrl"
>;

/** The opportunity as it is nested in the user's applications list. */
export type ApplicationOpportunity = Pick<
  JobOpportunity,
  | "id"
  | "title"
  | "city"
  | "country"
  | "salary"
  | "currency"
  | "level"
  | "status"
  | "positionType"
> & {
  club: Pick<Club, "id" | "name" | "logo">;
};

/** One row of userApplications / the result of applyForJob. */
export type UserApplication = Pick<
  JobApplication,
  "id" | "jobOpportunityId" | "status" | "appliedAt"
> & {
  updatedAt?: string;
  jobOpportunity?: ApplicationOpportunity;
};
