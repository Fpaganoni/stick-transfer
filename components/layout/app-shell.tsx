"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SideNavigation } from "./side-navigation";
import { Header } from "./header";
import { useAuthStore } from "@/stores/useAuthStore";
import { Role } from "@/types/enums";
import { Spinner } from "@/components/ui/spinner";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
}

/**
 * AppShell wraps every authenticated, non-admin page with:
 *  - A collapsible left sidebar (SideNavigation)
 *  - A top Header (sticky)
 *  - A scrollable main content area
 *
 * Also guards SUPERADMIN users away from these routes — they belong in /admin.
 */
export function AppShell({ children, title }: AppShellProps) {
  const router = useRouter();
  const locale = useLocale();
  const { user } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const isSuperAdmin = user?.role === Role.SUPERADMIN;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !isSuperAdmin) return;
    const localePrefix = locale === "en" ? "" : `/${locale}`;
    router.replace(`${localePrefix}/admin`);
  }, [hydrated, isSuperAdmin, locale, router]);

  if (!hydrated || isSuperAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <SideNavigation />
      <SidebarInset>
        <Header title={title} />
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
