"use client";

import { useId } from "react";
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
  type LucideIcon,
} from "lucide-react";
import {
  socialProfileUrl,
  toMailtoUrl,
  toTelUrl,
  toWebsiteUrl,
  type SocialPlatform,
} from "@/lib/social-links";

interface ClubContactSectionProps {
  club: Club;
}

type ContactField = "website" | "email" | "phone";

const contactLinks: Array<{
  field: ContactField;
  icon: LucideIcon;
  href: (value: string) => string | null;
}> = [
  { field: "website", icon: Globe, href: toWebsiteUrl },
  { field: "email", icon: Mail, href: toMailtoUrl },
  { field: "phone", icon: Phone, href: toTelUrl },
];

// Brand names: not translated.
const socialLinks: Array<{ field: SocialPlatform; icon: LucideIcon; label: string }> = [
  { field: "instagram", icon: Instagram, label: "Instagram" },
  { field: "twitter", icon: Twitter, label: "X (Twitter)" },
  { field: "facebook", icon: Facebook, label: "Facebook" },
  { field: "tiktok", icon: Music, label: "TikTok" },
];

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function ClubContactSection({ club }: ClubContactSectionProps) {
  const t = useTranslations("clubs.detail");
  const headingId = useId();

  // Only values that make a safe, working link are rendered.
  const contacts = contactLinks.flatMap(({ field, icon, href }) => {
    const value = club[field];
    const url = value ? href(value) : null;
    return value && url ? [{ field, icon, value, url }] : [];
  });
  const socials = socialLinks.flatMap(({ field, icon, label }) => {
    const value = club[field];
    const url = value ? socialProfileUrl(field, value) : null;
    return url ? [{ field, icon, label, url }] : [];
  });

  if (contacts.length === 0 && socials.length === 0) return null;

  return (
    <section aria-labelledby={headingId} className="mt-12">
      <h2
        id={headingId}
        className="text-xl sm:text-2xl font-bold text-foreground mb-6 sm:mb-8"
      >
        {t("contactAndSocial")}
      </h2>

      <div className="grid md:grid-cols-2 gap-6 md:gap-8">
        {contacts.length > 0 && (
          <div className="min-w-0 space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">
              {t("contactInfo")}
            </h3>
            <div className="space-y-3">
              {contacts.map(({ field, icon: Icon, value, url }) => (
                <a
                  key={field}
                  href={url}
                  target={field === "website" ? "_blank" : undefined}
                  rel={field === "website" ? "noopener noreferrer" : undefined}
                  className={`flex items-center gap-3 p-3 rounded-lg bg-background border border-border hover:border-primary/50 hover:bg-primary/5 transition duration-200 group overflow-hidden ${focusRing}`}
                >
                  <div className="shrink-0 text-primary/70 group-hover:text-primary transition-colors">
                    <Icon aria-hidden className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground-muted">{t(field)}</p>
                    <p className="text-foreground text-sm font-medium truncate">
                      {value}
                    </p>
                  </div>
                  <div
                    aria-hidden
                    className="shrink-0 text-primary/0 group-hover:text-primary/70 transition-colors"
                  >
                    →
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {socials.length > 0 && (
          <div className="min-w-0 space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">
              {t("followUs")}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {socials.map(({ field, icon: Icon, label, url }) => (
                <a
                  key={field}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex flex-col items-center justify-center p-3 sm:p-6 rounded-lg bg-background border border-border hover:border-primary/50 hover:bg-primary/5 sm:motion-safe:hover:scale-105 transition duration-200 group ${focusRing}`}
                >
                  <div className="text-primary/70 group-hover:text-primary transition-colors mb-2">
                    <Icon aria-hidden className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-foreground-muted group-hover:text-foreground transition-colors text-center">
                    {label}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
