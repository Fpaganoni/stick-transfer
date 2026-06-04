"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Target, Compass, Building2, Newspaper, MessageSquare, User } from "lucide-react";

export function BottomNavigation() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("navigation");

  const navItems = [
    { href: "/opportunities", label: t("opportunities"), icon: Target },
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
    <nav className="fixed bottom-0 left-0 right-0 bg-background/30 border-t border-border h-20 flex items-center justify-around px-4 z-40 backdrop-blur-sm">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = isActiveRoute(href);
        const localizedHref = getLocalizedHref(href);

        return (
          <Link
            key={href}
            href={localizedHref}
            className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-transform duration-200 cursor-pointer hover:scale-105 ${
              isActive
                ? "text-primary scale-110"
                : "text-foreground hover:text-primary"
            }`}
          >
            <Icon size={24} className={isActive ? "animate-bounce" : ""} />
            <span className="text-xs font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
