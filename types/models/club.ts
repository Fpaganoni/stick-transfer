export interface ClubMember {
  id: string;
  role: string;
  status: string;
  joinedAt?: string;
  user: {
    id: string;
    username: string;
    name: string;
    avatar?: string;
    position?: string;
    role?: string;
  };
}

export interface ClubManagedBy {
  firstName: string;
  lastName: string;
}

export type ClubVerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

/**
 * A CLUB account IS the club: name, logo (crest), coverImage, city and country
 * are the owner User's fields, resolved by the backend.
 */
export interface Club {
  id: string;
  name: string;
  /** The crest: the owner User.avatar. */
  logo?: string;
  coverImage?: string;
  coverImagePosition?: string | null;
  description?: string;
  /** Short bio: the owner User.bio. */
  bio?: string | null;
  city?: string;
  country?: string;
  league?: string;
  foundedYear?: number | null;
  benefits?: string[];
  type?: "Team" | "Organization" | "Brand";
  createdAt?: string;
  /** Private: only the club itself and SUPERADMIN receive it, everyone else gets null. */
  managedBy?: ClubManagedBy | null;
  isVerified?: boolean;
  verificationStatus?: ClubVerificationStatus;
  verificationDoc?: string;
  website?: string;
  email?: string;
  phone?: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  tiktok?: string;
  members?: ClubMember[];
  /** @deprecated Clubs have no gallery any more; the backend always sends []. */
  videos?: string[];
  user?: {
    id: string;
    username?: string | null;
    avatar?: string;
  };
  /** Same number as User.followersCount of the club account (CLUB axis only). */
  followersCount?: number;
  isFollowedByCurrentUser?: boolean;
}

export type ClubBasic = Pick<Club, "id" | "name" | "logo">;

/** Identity (name, username, bio, crest, cover, place) + club data, saved in one transaction. */
export interface UpdateClubVariables {
  id: string;
  name?: string;
  username?: string;
  bio?: string;
  description?: string;
  league?: string;
  foundedYear?: number;
  benefits?: string[];
  city?: string;
  country?: string;
  logo?: string;
  coverImage?: string;
  coverImagePosition?: string;
  website?: string;
  email?: string;
  phone?: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  tiktok?: string;
  managedByFirstName?: string;
  managedByLastName?: string;
}
