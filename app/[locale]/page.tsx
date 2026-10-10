"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { LandingPage } from "@/components/pages/landing-page";
import { useAuthStore } from "@/stores/useAuthStore";
import { useAuthHydrated } from "@/hooks/ui/use-auth-hydrated";

/**
 * Landing for visitors. Signed-in users belong in the app: proxy.ts redirects
 * them to /opportunities when the st-auth cookie is present, and this covers a
 * session whose cookie is missing (AuthInitializer re-arms it).
 */
export default function Home() {
  const router = useRouter();
  const locale = useLocale();
  const hydrated = useAuthHydrated();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const shouldEnterApp = hydrated && isLoggedIn;

  useEffect(() => {
    if (!shouldEnterApp) return;
    const localePrefix = locale === "en" ? "" : `/${locale}`;
    router.replace(`${localePrefix}/opportunities`);
  }, [shouldEnterApp, locale, router]);

  if (shouldEnterApp) return null;

  return <LandingPage />;
}
