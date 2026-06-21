"use client";

import { useTranslations } from "next-intl";
import { Club } from "@/types/models/club";
import {
  Globe,
  Mail,
  Phone,
  Instagram,
  Twitter,
  Facebook,
  Music,
} from "lucide-react";

interface ClubContactSectionProps {
  club: Club;
}

const contactLinks: Array<{
  field: keyof Pick<Club, "website" | "email" | "phone">;
  icon: React.ReactNode;
  label: string;
  href?: (value: string) => string;
}> = [
  {
    field: "website",
    icon: <Globe className="w-5 h-5" />,
    label: "Website",
    href: (value) => value.startsWith("http") ? value : `https://${value}`,
  },
  {
    field: "email",
    icon: <Mail className="w-5 h-5" />,
    label: "Email",
    href: (value) => `mailto:${value}`,
  },
  {
    field: "phone",
    icon: <Phone className="w-5 h-5" />,
    label: "Phone",
    href: (value) => `tel:${value}`,
  },
];

const socialLinks: Array<{
  field: keyof Pick<Club, "instagram" | "twitter" | "facebook" | "tiktok">;
  icon: React.ReactNode;
  label: string;
  href: (value: string) => string;
}> = [
  {
    field: "instagram",
    icon: <Instagram className="w-5 h-5" />,
    label: "Instagram",
    href: (value) => `https://instagram.com/${value.replace("@", "")}`,
  },
  {
    field: "twitter",
    icon: <Twitter className="w-5 h-5" />,
    label: "Twitter",
    href: (value) => `https://twitter.com/${value.replace("@", "")}`,
  },
  {
    field: "facebook",
    icon: <Facebook className="w-5 h-5" />,
    label: "Facebook",
    href: (value) => `https://facebook.com/${value.replace("@", "")}`,
  },
  {
    field: "tiktok",
    icon: <Music className="w-5 h-5" />,
    label: "TikTok",
    href: (value) => `https://tiktok.com/@${value.replace("@", "")}`,
  },
];

export function ClubContactSection({ club }: ClubContactSectionProps) {
  const t = useTranslations("clubs.detail");
  const hasContact = contactLinks.some((link) => club[link.field]);
  const hasSocial = socialLinks.some((link) => club[link.field]);

  if (!hasContact && !hasSocial) return null;

  return (
    <section className="mt-12 overflow-hidden">
      <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6 sm:mb-8">
        {t("contactAndSocial")}
      </h2>

      <div className="grid md:grid-cols-2 gap-6 md:gap-8">
        {/* Contacto */}
        {hasContact && (
          <div className="min-w-0 space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">
              {t("contactInfo")}
            </h3>
            <div className="space-y-3">
              {contactLinks.map(
                ({ field, icon, label, href }) =>
                  club[field] && (
                    <a
                      key={field}
                      href={href?.(club[field] as string)}
                      target={field === "website" ? "_blank" : undefined}
                      rel={field === "website" ? "noopener noreferrer" : undefined}
                      className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 cursor-pointer group overflow-hidden"
                    >
                      <div className="shrink-0 text-primary/70 group-hover:text-primary transition-colors">
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground/60">{label}</p>
                        <p className="text-foreground text-sm font-medium truncate">
                          {club[field]}
                        </p>
                      </div>
                      <div className="shrink-0 text-primary/0 group-hover:text-primary/70 transition-colors">
                        →
                      </div>
                    </a>
                  )
              )}
            </div>
          </div>
        )}

        {/* Redes Sociales */}
        {hasSocial && (
          <div className="min-w-0 space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">
              {t("followUs")}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {socialLinks.map(
                ({ field, icon, label, href }) =>
                  club[field] && (
                    <a
                      key={field}
                      href={href(club[field] as string)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center p-3 sm:p-6 rounded-lg bg-background border border-border hover:border-primary/50 hover:bg-primary/5 sm:hover:scale-105 transition-all duration-200 cursor-pointer group"
                    >
                      <div className="text-primary/70 group-hover:text-primary transition-colors mb-2">
                        {icon}
                      </div>
                      <span className="text-xs text-foreground/60 group-hover:text-foreground/80 transition-colors text-center">
                        {label}
                      </span>
                    </a>
                  )
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
