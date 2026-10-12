/**
 * Club website and social profile helpers. The backend stores these fields as
 * free text, so the edit form normalizes socials to a bare handle and the club
 * page rebuilds the profile link (also for legacy rows that hold a full URL).
 */
export const SOCIAL_PLATFORMS = ["instagram", "twitter", "facebook", "tiktok"] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

const PLATFORM_HOSTS: Record<SocialPlatform, readonly string[]> = {
  instagram: ["instagram.com"],
  twitter: ["twitter.com", "x.com"],
  facebook: ["facebook.com", "fb.com"],
  tiktok: ["tiktok.com"],
};

const PROFILE_URL_PREFIX: Record<SocialPlatform, string> = {
  instagram: "https://instagram.com/",
  twitter: "https://x.com/",
  facebook: "https://facebook.com/",
  tiktok: "https://tiktok.com/@",
};

const HANDLE_PATTERN = /^[A-Za-z0-9._]{1,50}$/;
/** Facebook profiles without a username are addressed by numeric id. */
const FACEBOOK_ID_PROFILE_PATTERN = /^profile\.php\?id=\d+$/;
const HAS_PROTOCOL = /^[a-z][a-z0-9+.-]*:/i;
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

  const [firstSegment] = url.pathname.split("/").filter(Boolean);
  if (!firstSegment) return null;

  const id = url.searchParams.get("id");
  if (platform === "facebook" && firstSegment === "profile.php" && id) {
    return `profile.php?id=${id}`;
  }
  return firstSegment.replace(/^@/, "");
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

  const looksLikeUrl = HAS_PROTOCOL.test(value) || BARE_DOMAIN_PATH.test(value);
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
