"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Target, Compass, Building2, Newspaper, MessageSquare, User } from "lucide-react";
import { HockeyXTicks } from "../ui/hockey-xtick";
import { motion } from "framer-motion";

export function SideNavigation() {
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
    <nav className="fixed left-0 top-0 h-screen w-28 flex flex-col items-center py-5 gap-2 bg-background/60 backdrop-blur-md border-r border-border z-40">
      {/* Logo */}
      <motion.div
        whileHover={{ scale: 1.12 }}
        transition={{ duration: 0.2 }}
        className="mb-6 flex items-center justify-center w-10 h-10 cursor-pointer"
      >
        <Link href={getLocalizedHref("/opportunities")} aria-label="Home">
          <HockeyXTicks size={32} className="text-foreground" />
        </Link>
      </motion.div>

      {/* Nav items */}
      <div className="flex flex-col items-center gap-2 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = isActiveRoute(href);
          const localizedHref = getLocalizedHref(href);

          return (
            <Link
              key={href}
              href={localizedHref}
              title={label}
              aria-label={label}
              className={`group relative flex flex-col items-center justify-center gap-1 w-20 p-6 rounded-xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-foreground/70 hover:bg-primary/10 hover:text-primary"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="activeIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"
                />
              )}

              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.15 }}
              >
                <Icon
                  size={22}
                  className={
                    isActive ? "animate-[bounce_0.4s_ease-in-out_1]" : ""
                  }
                />
              </motion.div>
              <span className="text-[10px] font-medium leading-tight text-center">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
