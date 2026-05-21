"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
];

import { useState, useEffect } from "react";

export function LanguageSelector() {
  const [mounted, setMounted] = useState(false);
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleLanguageChange = (newLocale: string) => {
    // Get the current path without any locale prefix
    let pathnameWithoutLocale = pathname;

    // Remove current locale prefix if it exists (for es, fr)
    if (locale !== "en") {
      pathnameWithoutLocale = pathname.replace(`/${locale}`, "");
    }

    // Ensure path is valid and starts with /
    if (!pathnameWithoutLocale || pathnameWithoutLocale === "") {
      pathnameWithoutLocale = "/";
    } else if (!pathnameWithoutLocale.startsWith("/")) {
      pathnameWithoutLocale = "/" + pathnameWithoutLocale;
    }

    // Redirect to the new locale
    if (newLocale === "en") {
      // English doesn't need locale prefix (as-needed strategy)
      router.push(pathnameWithoutLocale);
    } else {
      // Other locales need their prefix
      router.push(`/${newLocale}${pathnameWithoutLocale}`);
    }

    // Force a refresh to reload the page with new locale
    router.refresh();
  };

  const currentLanguage = languages.find((lang) => lang.code === locale);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 h-9 px-4 py-2 rounded-lg bg-input/30 text-foreground opacity-50">
        <Globe size={20} />
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 h-9 px-4 py-2 rounded-lg bg-input/30 hover:bg-input/80 text-foreground transition-colors">
        <Globe size={20} />
        <span className="hidden md:inline">{currentLanguage?.flag}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-input" align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={`cursor-pointer ${
              locale === language.code
                ? "bg-primary text-foreground focus:bg-primary/80 focus:text-foreground"
                : "focus:bg-input/80 focus:text-foreground"
            }`}
          >
            <span className="mr-2">{language.flag}</span>
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
