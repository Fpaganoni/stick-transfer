import { Club } from "./club";
import {
  UmpireLicenseLevel,
  UmpireModality,
  UmpireCategory,
} from "../enums";

export interface JobOpportunity {
  id: string;
  title: string;
  description: string;
  positionType: string;
  level: "PROFESSIONAL" | "AMATEUR" | "professional" | "amateur";
  country: string;
  city: string;
  salary: number;
  currency: string;
  benefits: string[];
  status: "open" | "closed" | "filled";

  // Only set when positionType is UMPIRE
  licenseLevelRequired?: UmpireLicenseLevel | null;
  modality?: UmpireModality | null;
  umpireCategory?: UmpireCategory | null;
  matchDate?: string | null;

  // Per-user flags; the backend returns false without a session
  isSavedByCurrentUser?: boolean;
  // WITHDRAWN applications do not count
  hasAppliedByCurrentUser?: boolean;

  // Relations
  club: Club;

  // Metadata
  createdAt: string;
  updatedAt?: string;
}

// Variantes
export type JobOpportunityCard = Pick<
  JobOpportunity,
  | "id"
  | "title"
  | "positionType"
  | "level"
  | "city"
  | "country"
  | "club"
  | "salary"
  | "currency"
  | "status"
>;
export type JobOpportunityBasic = Pick<
  JobOpportunity,
  "id" | "title" | "description" | "status"
>;

// Para crear/actualizar
export type CreateJobOpportunityInput = Omit<
  JobOpportunity,
  "id" | "createdAt" | "updatedAt" | "club"
>;
export type UpdateJobOpportunityInput = Partial<
  Omit<JobOpportunity, "id" | "createdAt">
>;

export interface CreateJobOpportunityVariables {
  title: string;
  description: string;
  positionType: string;
  level: string;
  country: string;
  city: string;
  salary?: number;
  currency?: string;
  // Comma separated; the backend takes a single String
  benefits?: string;
  // UMPIRE only: the backend answers 400 if these are sent for any other positionType
  licenseLevelRequired?: UmpireLicenseLevel;
  modality?: UmpireModality;
  umpireCategory?: UmpireCategory;
  matchDate?: string;
}
