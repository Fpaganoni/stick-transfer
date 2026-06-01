import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { locales } from "./i18n/request";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeDetection: false,
});

const PROTECTED_PATHS = [
  "/opportunities",
  "/explore",
  "/profile",
  "/clubs",
  "/messages",
  "/onboarding",
];

function isProtectedPath(pathname: string): boolean {
  const withoutLocale = pathname.replace(/^\/(en|es|fr)/, "") || "/";
  return PROTECTED_PATHS.some(
    (p) => withoutLocale === p || withoutLocale.startsWith(p + "/")
  );
}

function getLocaleFromPath(pathname: string): string {
  const match = pathname.match(/^\/(en|es|fr)/);
  return match ? match[1] : "en";
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isProtectedPath(pathname)) {
    const authCookie = request.cookies.get("st-auth");
    if (!authCookie?.value) {
      const locale = getLocaleFromPath(pathname);
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!api|_next|_vercel)(?!.*\\.(?:ico|png|jpg|jpeg|gif|webp|avif|svg|css|js|ts|json|txt|xml|woff2?|ttf|eot|map)(?:\\?.*)?$).*)",
  ],
};
