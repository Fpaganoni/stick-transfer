/** Routes that need a session; visitors are sent to the landing. */
export const PROTECTED_PATHS = [
  "/opportunities",
  "/explore",
  "/profile",
  "/clubs",
  "/messages",
  "/onboarding",
  "/admin",
];

export function isProtectedPath(pathname: string): boolean {
  const withoutLocale = pathname.replace(/^\/(en|es|fr)/, "") || "/";
  return PROTECTED_PATHS.some(
    (p) => withoutLocale === p || withoutLocale.startsWith(p + "/")
  );
}
