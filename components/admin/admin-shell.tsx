"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  Newspaper,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LanguageSelector } from "@/components/ui/language-selector";
import { ThemeToggleButton } from "@/components/ui/toggleThemeRight";
import { useAuthStore } from "@/stores/useAuthStore";

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("admin.nav");
  const locale = useLocale();
  const { user, logout } = useAuthStore();

  const navItems = [
    { href: "/admin", label: t("overview"), icon: LayoutDashboard },
    { href: "/admin/users", label: t("users"), icon: Users },
    { href: "/admin/clubs", label: t("clubs"), icon: Building2 },
    { href: "/admin/jobs", label: t("jobs"), icon: Briefcase },
    { href: "/admin/news", label: t("news"), icon: Newspaper },
  ];

  const localePrefix = locale === "en" ? "" : `/${locale}`;
  const isActive = (href: string) => {
    const target = `${localePrefix}${href}`;
    return href === "/admin" ? pathname === target : pathname.startsWith(target);
  };
  const activeItem = navItems.find((item) => isActive(item.href));

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <LayoutDashboard className="size-5 text-primary" />
            <span className="text-sm font-semibold group-data-[collapsible=icon]:hidden">
              {t("title")}
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{t("sectionLabel")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.href)}
                      tooltip={item.label}
                    >
                      <a href={`${localePrefix}${item.href}`}>
                        <item.icon />
                        <span>{item.label}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} tooltip={t("logout")}>
                <LogOut />
                <span>{t("logout")}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{activeItem?.label ?? t("title")}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSelector />
            <ThemeToggleButton />
            <div className="flex items-center gap-2 pl-2">
              <Avatar className="size-8">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback>{user?.name?.[0]?.toUpperCase() ?? "A"}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">{user?.name}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} title={t("logout")}>
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
