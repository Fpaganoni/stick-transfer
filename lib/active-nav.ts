import { locales } from "@/i18n/request";

/** The app home ("/" and "/<locale>") lands on the opportunities board. */
const HOME_HREF = "/opportunities";
const PROFILE_HREF = "/profile";
const OWN_PROFILE_SUBPATHS = ["/edit"];

function stripLocale(pathname: string): string {
  const [, first, ...rest] = pathname.split("/");
  if (!(locales as readonly string[]).includes(first)) return pathname || "/";
  return `/${rest.join("/")}`;
}

function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function matchesHref(path: string, href: string): boolean {
  return path === href || path.startsWith(`${href}/`);
}

/**
 * /profile/<slug> is a public profile; the route joins the slug segments with
 * "." to get the username. Only the viewer's own one counts as "Profile".
 */
function isOwnProfilePath(path: string, ownUsername?: string): boolean {
  const rest = path.slice(PROFILE_HREF.length);
  if (rest === "" || OWN_PROFILE_SUBPATHS.some((sub) => matchesHref(rest, sub))) {
    return true;
  }
  if (!ownUsername) return false;

  const slug = rest.split("/").filter(Boolean).map(safeDecode).join(".");
  return slug === ownUsername;
}

/**
 * The nav href to highlight for a (possibly locale-prefixed) pathname: the
 * longest href that matches the path or one of its sub-routes, or null.
 */
export function getActiveNavHref(
  pathname: string,
  hrefs: readonly string[],
  ownUsername?: string,
): string | null {
  const path = stripLocale(pathname);
  if (path === "/") return hrefs.includes(HOME_HREF) ? HOME_HREF : null;

  const matches = hrefs.filter(
    (href) =>
      matchesHref(path, href) &&
      (href !== PROFILE_HREF || isOwnProfilePath(path, ownUsername)),
  );
  if (matches.length === 0) return null;
  return matches.reduce((longest, href) => (href.length > longest.length ? href : longest));
}
