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
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Image from "next/image";

export function SideNavigation() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("navigation");
  const tOpportunities = useTranslations("opportunities");
  const { state } = useSidebar();
  const { isClub, isLoading: isRoleLoading } = useRole();
  const storedRole = useAuthStore((s) => s.user?.role);
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

  const isActiveRoute = (href: string) => {
    const localizedHref = getLocalizedHref(href);

    if (
      href === "/opportunities" &&
      (pathname === "/" || pathname === `/${locale}`)
    ) {
      return true;
    }

    return pathname === localizedHref || pathname === href;
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href={getLocalizedHref("/opportunities")}
          aria-label="Home"
          className="flex w-full items-center justify-center px-2 py-1.5 group-data-[collapsible=icon]:px-0"
        >
          <Image
            src="/logo-og.png"
            alt="stick transfer logo"
            width={state === "collapsed" ? 32 : 180}
            height={state === "collapsed" ? 32 : 65}
            className={
              state === "collapsed" ? "h-8 w-8 shrink-0" : "h-9 w-auto shrink-0"
            }
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
                    isActive={isActiveRoute(href)}
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
