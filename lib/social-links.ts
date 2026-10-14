/**
 * Club website and social profile helpers. The backend stores these fields as
 * free text, so the edit form normalizes socials to a bare handle and the club
 * page rebuilds the profile link (also for legacy rows that hold a full URL).
 */
import * as z from "zod";

export const SOCIAL_PLATFORMS = ["instagram", "twitter", "facebook", "tiktok"] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

const PLATFORM_HOSTS: Record<SocialPlatform, readonly string[]> = {
  instagram: ["instagram.com"],
  twitter: ["twitter.com", "x.com"],
  facebook: ["facebook.com", "fb.com"],
  tiktok: ["tiktok.com"],
};

/** First path segments that are posts, pages or app routes, never a profile. */
const RESERVED_PATHS: Record<SocialPlatform, ReadonlySet<string>> = {
  instagram: new Set(["p", "reel", "reels", "explore", "stories", "tv", "accounts", "direct"]),
  twitter: new Set(["intent", "share", "home", "i", "search", "hashtag", "explore", "settings"]),
  facebook: new Set(["pages", "groups", "watch", "events", "share", "sharer", "people", "marketplace", "photo.php", "story.php"]),
  tiktok: new Set(["discover", "tag", "music", "video", "explore", "search"]),
};

const KNOWN_HOSTS = new Set(Object.values(PLATFORM_HOSTS).flat());

const PROFILE_URL_PREFIX: Record<SocialPlatform, string> = {
  instagram: "https://instagram.com/",
  twitter: "https://x.com/",
  facebook: "https://facebook.com/",
  tiktok: "https://tiktok.com/@",
};

// At least one letter or digit: "." or ".." would link to the platform root.
const HANDLE_PATTERN = /^(?=.*[A-Za-z0-9])[A-Za-z0-9._]{1,50}$/;
/** Facebook profiles without a username are addressed by numeric id. */
const FACEBOOK_ID_PROFILE_PATTERN = /^profile\.php\?id=\d+$/;
// A colon followed by a digit is a port ("club.com:8080"), not a scheme.
const HAS_PROTOCOL = /^[a-z][a-z0-9+.-]*:(?!\d)/i;
const EMAIL_SCHEMA = z.string().email();
const BARE_DOMAIN_PATH = /^(www\.|m\.|mobile\.)?[a-z0-9-]+(\.[a-z0-9-]+)+\//i;
const HOST_PREFIX = /^(www|m|mobile)\./;

function parseHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function handleFromProfileUrl(platform: SocialPlatform, url: URL): string | null {
  const host = url.hostname.toLowerCase().replace(HOST_PREFIX, "");
  if (!PLATFORM_HOSTS[platform].includes(host)) return null;

  const segments = url.pathname.split("/").filter(Boolean);
  const id = url.searchParams.get("id");
  if (platform === "facebook" && segments[0] === "profile.php" && id) {
    return `profile.php?id=${id}`;
  }

  // A profile URL has exactly one segment; deeper paths are posts or pages.
  if (segments.length !== 1 || RESERVED_PATHS[platform].has(segments[0].toLowerCase())) {
    return null;
  }
  return segments[0].replace(/^@/, "");
}

/** "instagram.com" typed alone is a domain, not a handle that contains dots. */
function isBarePlatformDomain(value: string): boolean {
  return KNOWN_HOSTS.has(value.toLowerCase().replace(/\/$/, "").replace(HOST_PREFIX, ""));
}

/**
 * Bare handle for "@handle", "handle" or a profile URL of that platform;
 * null when empty or not a valid handle.
 */
export function normalizeSocialHandle(
  platform: SocialPlatform,
  input: string,
): string | null {
  const value = input.trim();
  if (!value) return null;

  const looksLikeUrl =
    HAS_PROTOCOL.test(value) || BARE_DOMAIN_PATH.test(value) || isBarePlatformDomain(value);
  let handle: string | null;
  if (looksLikeUrl) {
    const url = parseHttpUrl(HAS_PROTOCOL.test(value) ? value : `https://${value}`);
    handle = url ? handleFromProfileUrl(platform, url) : null;
  } else {
    handle = value.replace(/^@/, "");
  }
  if (!handle) return null;

  if (HANDLE_PATTERN.test(handle)) return handle;
  if (platform === "facebook" && FACEBOOK_ID_PROFILE_PATTERN.test(handle)) return handle;
  return null;
}

/** Profile link for a stored handle (or legacy URL); null when it is not valid. */
export function socialProfileUrl(platform: SocialPlatform, stored: string): string | null {
  const handle = normalizeSocialHandle(platform, stored);
  return handle ? `${PROFILE_URL_PREFIX[platform]}${handle}` : null;
}

/**
 * http(s) URL for a website typed with or without protocol; null when empty,
 * not http(s) or without a dotted host.
 */
export function toWebsiteUrl(input: string): string | null {
  const value = input.trim();
  if (!value) return null;

  const url = parseHttpUrl(HAS_PROTOCOL.test(value) ? value : `https://${value}`);
  if (!url || !url.hostname.includes(".")) return null;

  // URL adds a trailing "/" to a bare host; keep what the club typed.
  return url.pathname === "/" && !url.search && !url.hash
    ? `${url.protocol}//${url.host}`
    : url.href;
}

/**
 * href for an already-stored link (CV, certificate, verification document):
 * plain http(s) only and never completed, so `javascript:`/`data:` values that
 * reached the database are never rendered as clickable links. Null otherwise.
 */
export function toSafeLinkUrl(input: string | null | undefined): string | null {
  const value = input?.trim();
  if (!value) return null;
  return parseHttpUrl(value)?.href ?? null;
}

export function isValidEmail(value: string): boolean {
  return EMAIL_SCHEMA.safeParse(value.trim()).success;
}

/** mailto link for a stored email; null when it is not a plain valid address. */
export function toMailtoUrl(value: string): string | null {
  return isValidEmail(value) ? `mailto:${value.trim()}` : null;
}

/** tel link with digits and a leading "+" only; null when there are no digits. */
export function toTelUrl(value: string): string | null {
  const digits = value.replace(/[^\d+]/g, "");
  return /\d/.test(digits) ? `tel:${digits}` : null;
}
