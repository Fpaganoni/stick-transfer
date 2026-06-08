"use client";

import { Bell, LogOut } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { SidebarTrigger, SidebarMenuButton } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LanguageSelector } from "../ui/language-selector";
import { ThemeToggleControl } from "../ui/theme-provider";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNotificationsStore } from "@/stores/useNotificationsStore";
import { useUnreadNotificationsCount } from "@/hooks/useNotifications";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";

interface HeaderProps {
  title?: string;
}

export function Header({ title = "Hockey Connect" }: HeaderProps) {
  const [showLogout, setShowLogout] = useState(false);
  const { user, logout } = useAuthStore();
  const t = useTranslations("navigation");
  const { isOpen: isNotificationsOpen, toggle } = useNotificationsStore();
  const { data: countData } = useUnreadNotificationsCount();

  const unreadCount = countData?.unreadNotificationsCount ?? 0;

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 bg-background/30 backdrop-blur-sm border-b border-border z-30 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <h1 className="text-xl ml-2 font-bold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <LanguageSelector variant="toolbar" />
        <ThemeToggleControl />

        <div className="relative">
          <SidebarMenuButton
            size="topbar"
            isActive={isNotificationsOpen}
            onClick={toggle}
            aria-label="Notifications"
          >
            <Bell />
          </SidebarMenuButton>
          {unreadCount > 0 && (
            <span className="absolute flex items-center justify-center p-1.5 text-xs text-white font-bold top-1 right-1 min-w-3 h-3 bg-error rounded-full pointer-events-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          <NotificationDropdown />
        </div>

        <div className="flex items-center gap-2 pl-2">
          <Avatar className="size-8">
            <AvatarImage src={user?.avatar} alt={user?.name} />
            <AvatarFallback>{user?.name?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium sm:inline">{user?.name}</span>
        </div>

        <div className="relative">
          <SidebarMenuButton
            size="topbar"
            isActive={showLogout}
            onClick={() => setShowLogout(!showLogout)}
            aria-label={t("logout")}
          >
            <LogOut />
          </SidebarMenuButton>
          {showLogout && (
            <button
              onClick={handleLogout}
              className="absolute right-0 top-full mt-2 px-4 py-2 bg-background border border-border rounded-md text-foreground text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground shadow-lg transition-colors cursor-pointer whitespace-nowrap z-50"
            >
              {t("logout")}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
