"use client";

import { Bell, LogOut } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
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
  const { logout } = useAuthStore();
  const t = useTranslations("navigation");
  const { toggle } = useNotificationsStore();
  const { data: countData } = useUnreadNotificationsCount();

  const unreadCount = countData?.unreadNotificationsCount ?? 0;

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 bg-background/30 backdrop-blur-sm border-b border-border z-30 px-4 py-3 flex items-center justify-between">
      {/* Page title */}
      <h1 className="text-xl ml-8 font-bold text-foreground">{title}</h1>

      <div className="flex items-center gap-3">
        <LanguageSelector />
        <ThemeToggleControl />

        <div className="relative">
          <button
            onClick={toggle}
            className="group p-2 hover:bg-primary/85 rounded-lg transition-colors cursor-pointer relative"
            aria-label="Notifications"
          >
            <Bell
              size={24}
              className="text-foreground group-hover:text-white-black transition-colors"
            />
            {unreadCount > 0 && (
              <span className="absolute flex items-center justify-center p-1.5 text-xs text-white font-bold top-1 right-1 min-w-3 h-3 bg-error rounded-full">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
          <NotificationDropdown />
        </div>

        <div className="relative">
          <button
            onClick={() => setShowLogout(!showLogout)}
            className="p-2 hover:bg-primary/85 group group-hover:text-white-black rounded-lg transition-colors cursor-pointer"
          >
            <LogOut
              size={20}
              className="text-foreground group-hover:text-white-black transition-colors"
            />
          </button>
          {showLogout && (
            <button
              onClick={handleLogout}
              className="absolute right-0 top-full mt-2 px-4 py-2 bg-background border-2 border-border rounded-lg text-foreground text-sm hover:bg-primary hover:text-background shadow-lg transition-colors cursor-pointer whitespace-nowrap z-50"
            >
              {t("logout")}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
