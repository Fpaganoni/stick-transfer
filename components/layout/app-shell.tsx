"use client";

import type React from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SideNavigation } from "./side-navigation";
import { Header } from "./header";
import { PageContentSkeleton } from "./page-content-skeleton";
import { useAuthStore } from "@/stores/useAuthStore";
import { useAuthHydrated } from "@/hooks/ui/use-auth-hydrated";
import { usePageTitle } from "@/hooks/usePageTitle";
import { isProtectedPath } from "@/lib/protected-paths";
import { Role } from "@/types/enums";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * AppShell wraps every non-admin app page with:
 *  - A collapsible left sidebar (SideNavigation)
 *  - A top Header (sticky) whose title follows the pathname
 *  - A scrollable main content area
 *
 * It is rendered once by app/[locale]/(app)/layout.tsx, so navigating between
 * pages only swaps `children`. While the persisted auth store hydrates (first
 * load only) the sidebar and header stay visible and the content shows a
 * placeholder; pages read the stored user, so they wait for it.
 *
 * Also guards SUPERADMIN users away from these routes — they belong in /admin —
 * and visitors away from protected ones: proxy.ts lets them through when a
 * stale routing cookie survived a logout elsewhere.
 */
export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const locale = useLocale();
  const hydrated = useAuthHydrated();
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const title = usePageTitle();
  const isSuperAdmin = hydrated && user?.role === Role.SUPERADMIN;
  const isVisitorOnProtectedRoute = hydrated && !isLoggedIn && isProtectedPath(pathname);
  const localePrefix = locale === "en" ? "" : `/${locale}`;

  useEffect(() => {
    if (!isSuperAdmin) return;
    router.replace(`${localePrefix}/admin`);
  }, [isSuperAdmin, localePrefix, router]);

  useEffect(() => {
    if (!isVisitorOnProtectedRoute) return;
    // Drop the stale cookie first, or proxy.ts sends "/" straight back here
    fetch("/api/auth/session", { method: "DELETE" })
      .catch(() => {})
      .finally(() => router.replace(localePrefix || "/"));
  }, [isVisitorOnProtectedRoute, localePrefix, router]);

  const canRenderPage = hydrated && !isSuperAdmin && !isVisitorOnProtectedRoute;

  return (
    <SidebarProvider>
      <SideNavigation />
      <SidebarInset>
        <Header title={title} isLoadingUser={!hydrated} />
        <main className="flex-1">{canRenderPage ? children : <PageContentSkeleton />}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
