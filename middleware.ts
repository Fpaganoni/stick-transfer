import createMiddleware from "next-intl/middleware";
import { locales } from "./i18n/request";

export default createMiddleware({
  // A list of all locales that are supported
  locales: locales,

  // Used when no locale matches
  defaultLocale: "en",

  // Don't use locale prefix for default locale
  localePrefix: "as-needed",

  // Disable automatic locale detection from browser
  localeDetection: false,
});

export const config = {
  // Match all routes EXCEPT:
  // - /api/...
  // - /_next/... and /_vercel/...
  // - Real static asset files ending with a known extension
  // IMPORTANT: We do NOT exclude paths that merely contain a dot
  // (e.g. usernames like "franco.paganoni"). Only real file extensions are excluded.
  matcher: [
    "/((?!api|_next|_vercel)(?!.*\\.(?:ico|png|jpg|jpeg|gif|webp|avif|svg|css|js|ts|json|txt|xml|woff2?|ttf|eot|map)(?:\\?.*)?$).*)",
  ],
};
