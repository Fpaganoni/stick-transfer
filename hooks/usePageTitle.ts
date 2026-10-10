import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/stores/useAuthStore";

const LOCALE_PREFIX = /^\/(en|es|fr)(?=\/|$)/;

/** Exact routes of the (app) group and the translation key of their title. */
const TITLE_KEYS: Record<string, string> = {
  "/opportunities": "opportunities.availablePositions",
  "/opportunities/new": "opportunities.create.title",
  "/explore": "pageTitles.explore",
  "/clubs": "clubs.title",
  "/news": "news.pageTitle",
  "/messages": "pageTitles.messages",
  "/profile": "pageTitles.profile",
  "/profile/edit": "pageTitles.editProfile",
};

/** Dynamic routes, matched by prefix after the exact ones. */
const PREFIX_TITLE_KEYS: Array<[string, string]> = [
  ["/clubs/", "pageTitles.club"],
  ["/news/", "news.pageTitle"],
];

const PUBLIC_PROFILE_PREFIX = "/profile/";

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Header title of the persistent AppShell, derived from the pathname (with or
 * without locale prefix). A public profile shows its username, or "My Profile"
 * when it is the viewer's own.
 */
export function usePageTitle(): string {
  const pathname = usePathname() ?? "/";
  const t = useTranslations();
  const ownUsername = useAuthStore((state) => state.user?.username);

  const path = pathname.replace(LOCALE_PREFIX, "").replace(/\/+$/, "") || "/";

  const exactKey = TITLE_KEYS[path];
  if (exactKey) return t(exactKey);

  const prefixKey = PREFIX_TITLE_KEYS.find(([prefix]) => path.startsWith(prefix))?.[1];
  if (prefixKey) return t(prefixKey);

  if (path.startsWith(PUBLIC_PROFILE_PREFIX)) {
    // Same join as app/[locale]/(app)/profile/[...slug]/page.tsx
    const username = safeDecode(path.slice(PUBLIC_PROFILE_PREFIX.length).split("/").join("."));
    return username === ownUsername ? t("pageTitles.myProfile") : username;
  }

  return t("pageTitles.default");
}
