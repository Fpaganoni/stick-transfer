import {
  Role,
  Position,
  Level,
  UmpireLicenseLevel,
  TravelAvailability,
  UmpireModality,
  UmpireCategory,
} from "../enums";
import { Club } from "./club";

// Tipos relacionados con User
export interface UserBasicInfo {
  id: string;
  name: string;
  avatar?: string;
  username?: string;
}

export interface FollowVariables {
  followerType: string;
  followerId: string;
  followingType: string;
  followingId: string;
}

export interface FollowResponse {
  follow: { id: string; followerId: string; followingId: string };
}

export interface UnfollowResponse {
  unfollow: boolean;
}

export interface TrajectoryItem {
  id?: string;
  title: string;
  organization?: string;
  period: string;
  description: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  order?: number;
  club?: Club;
}

export interface UmpireCertification {
  id?: string;
  name: string;
  issuer: string;
  issuedAt?: string | null;
  fileUrl?: string | null;
  order?: number;
}

export interface User {
  id: string;
  /** Null for third parties: only the owner and SUPERADMIN receive it. */
  email: string | null;
  name: string;
  username: string;
  role: Role;
  isEmailVerified: boolean;

  // Profile
  avatar?: string;
  coverImage?: string;
  coverImagePosition?: string;
  bio?: string;
  position?: Position;
  country?: string;
  city?: string;
  level?: Level;
  yearsOfExperience?: number | null;
  cvUrl?: string;
  multimedia?: string[];
  isVerified?: boolean;

  // Umpire-only (backend rejects these on non-UMPIRE users)
  licenseLevel?: UmpireLicenseLevel | null;
  certifyingBody?: string | null;
  /** Visible only to the umpire and SUPERADMIN. */
  licenseNumber?: string | null;
  certificationYear?: number | null;
  matchesOfficiated?: number | null;
  travelAvailability?: TravelAvailability | null;
  languages?: string[];
  modalities?: UmpireModality[];
  umpireCategories?: UmpireCategory[];
  umpireCertifications?: UmpireCertification[];

  // Relations
  clubId?: string;
  club?: Club;
  trajectories?: TrajectoryItem[];

  // Totals; the lists are fetched on demand (see useFollowList)
  followersCount?: number;
  followingCount?: number;
  isFollowedByCurrentUser?: boolean;

  // Metadata (opcional)
  createdAt?: string;
  updatedAt?: string;
}

// Variantes para diferentes contextos
export type AuthUser = User;
export type UserBasic = Pick<User, "id" | "name" | "avatar" | "role">;
export type UserCard = Pick<
  User,
  "id" | "name" | "avatar" | "role" | "position"
>;
export type UserProfile = Omit<User, "email" | "isEmailVerified">;

export type ExploreUser = Pick<
  User,
  | "id"
  | "name"
  | "username"
  | "role"
  | "position"
  | "country"
  | "city"
  | "avatar"
  | "bio"
  | "level"
  | "licenseLevel"
  | "travelAvailability"
  | "modalities"
  | "umpireCategories"
  | "matchesOfficiated"
> & {
  isVerified?: boolean;
  club?: { id: string; name: string; logo?: string };
};

// Para crear/actualizar
export type CreateUserInput = Omit<User, "id" | "createdAt" | "updatedAt">;
export type UpdateUserInput = Partial<Omit<User, "id" | "email" | "role">>;



export interface UpdateUserVariables {
  id: string;
  name?: string;
  username?: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
  coverImagePosition?: string;
  position?: string;
  clubId?: string;
  cvUrl?: string;
  multimedia?: string[];
  country?: string;
  city?: string;
  yearsOfExperience?: number;
  trajectories?: TrajectoryItem[];
  // Umpire-only: omit these keys entirely for other roles (backend answers 400 otherwise)
  licenseLevel?: UmpireLicenseLevel;
  certifyingBody?: string;
  licenseNumber?: string;
  certificationYear?: number;
  matchesOfficiated?: number;
  travelAvailability?: TravelAvailability;
  languages?: string[];
  modalities?: UmpireModality[];
  umpireCategories?: UmpireCategory[];
  umpireCertifications?: UmpireCertification[];
}

export interface UploadCvVariables {
  userId: string;
  base64: string;
}

export interface UploadCvResponse {
  uploadCV: string; // returns the public cvUrl
}

export interface DeleteCvVariables {
  userId: string;
}

export interface DeleteCvResponse {
  deleteCV: boolean;
}

export interface LoginVariables {
  email: string;
  password: string;
}

export interface LoginResponse {
  login: Pick<User, "id" | "email" | "role">;
}

export interface RegisterVariables {
  email: string;
  name: string;
  username?: string;
  password: string;
  role?: string;
  country?: string;
  city?: string;
  position?: string;
  dateOfBirth?: string;
  clubName?: string;
  managedByFirstName?: string;
  managedByLastName?: string;
}

export interface RegisterResponse {
  register: string;
}


