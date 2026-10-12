"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Target,
  Compass,
  Building2,
  Newspaper,
  MessageSquare,
  User,
  PlusCircle,
} from "lucide-react";
import { useRole } from "@/hooks/useRole";
import { useAuthStore } from "@/stores/useAuthStore";
import { useAuthHydrated } from "@/hooks/ui/use-auth-hydrated";
import { Role } from "@/types/enums";
import { getActiveNavHref } from "@/lib/active-nav";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Image from "next/image";

export function SideNavigation() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("navigation");
  const tOpportunities = useTranslations("opportunities");
  const { isClub, isLoading: isRoleLoading } = useRole();
  const storedRole = useAuthStore((s) => s.user?.role);
  const storedUsername = useAuthStore((s) => s.user?.username);
  const hydrated = useAuthHydrated();
  // Navigation hint only (the create route has its own RoleGuard): while `me`
  // loads, trust the stored role so the club entry does not pop in and push the
  // rest of the menu down. Not before hydration, to match the server markup.
  const showPostJob =
    isClub || (hydrated && isRoleLoading && storedRole === Role.CLUB);

  const navItems = [
    { href: "/opportunities", label: t("opportunities"), icon: Target },
    ...(showPostJob
      ? [{ href: "/opportunities/new", label: tOpportunities("postJob"), icon: PlusCircle }]
      : []),
    { href: "/explore", label: t("players"), icon: Compass },
    { href: "/clubs", label: t("clubs"), icon: Building2 },
    { href: "/news", label: t("news"), icon: Newspaper },
    { href: "/messages", label: t("messages"), icon: MessageSquare },
    { href: "/profile", label: t("profile"), icon: User },
  ];

  const getLocalizedHref = (href: string) => {
    if (locale === "en") return href;
    return `/${locale}${href}`;
  };

  // Sub-routes count too (/profile/edit, /clubs/<id>). The username comes from
  // persisted storage, so it waits for hydration to match the server markup.
  const activeHref = getActiveNavHref(
    pathname,
    navItems.map(({ href }) => href),
    hydrated ? storedUsername : undefined,
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        {/* Both logos are rendered and CSS picks one, so collapsing never
            swaps markup (no hydration jump, no squashed wordmark). */}
        <Link
          href={getLocalizedHref("/opportunities")}
          aria-label={t("home")}
          className="flex w-full items-center justify-center rounded-md px-2 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:px-0"
        >
          <Image
            src="/icon-192.png"
            alt={t("logoAlt")}
            width={32}
            height={32}
            className="hidden size-8 shrink-0 group-data-[collapsible=icon]:block"
          />
          <Image
            src="/logo-og.png"
            alt={t("logoAlt")}
            width={180}
            height={65}
            preload
            className="h-9 w-auto shrink-0 group-data-[collapsible=icon]:hidden"
          />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    asChild
                    isActive={href === activeHref}
                    tooltip={label}
                  >
                    <Link href={getLocalizedHref(href)}>
                      <Icon />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
