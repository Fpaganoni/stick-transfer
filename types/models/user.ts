import { Role, Position, Level } from "../enums";
import { Club } from "./club";

// Tipos relacionados con User
export interface UserStats {
  gamesPlayed: number;
  goals: number;
  assists: number;
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

export interface User {
  id: string;
  email: string;
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
  yearsOfExperience?: number;
  cvUrl?: string;
  multimedia?: string[];

  // Relations
  clubId?: string;
  club?: Club;
  statistics?: UserStats;
  trajectories?: TrajectoryItem[];

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
  statistics?: {
    gamesPlayed?: number;
    goals?: number;
    assists?: number;
  };
  trajectories?: TrajectoryItem[];
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
  login: string;
}

export interface RegisterVariables {
  email: string;
  name: string;
  username: string;
  password: string;
  role: string;
}

export interface RegisterResponse {
  register: string;
}


