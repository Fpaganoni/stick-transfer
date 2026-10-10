"use client";

import Image from "next/image";
import { CountryLabel } from "@/components/ui/country-label";

// Keep existing imports below...
import { ArrowRight, BadgeCheck, MapPin, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { User } from "@/types/models/user";
import { Role } from "@/types/enums";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";

const ROLE_COLORS: Record<
  string,
  { bg: string; text: string; badge: string }
> = {
  PLAYER: {
    bg: "bg-success/20",
    text: "text-success",
    badge: "bg-success/20 text-foreground border-success",
  },
  COACH: {
    bg: "bg-warning/20",
    text: "text-warning",
    badge: "bg-warning/20 text-foreground border-warning",
  },
  UMPIRE: {
    bg: "bg-primary/10",
    text: "text-primary",
    badge: "bg-primary/20 text-foreground border-primary",
  },
};

type ProfileCardProps = Pick<
  User,
  | "id"
  | "name"
  | "username"
  | "role"
  | "position"
  | "country"
  | "city"
  | "level"
  | "bio"
  | "avatar"
  | "licenseLevel"
  | "matchesOfficiated"
  | "modalities"
  | "umpireCategories"
> & { isVerified?: boolean };

export function ProfileCard({
  name,
  username,
  role,
  avatar,
  position,
  city,
  country,
  level,
  bio,
  isVerified,
  licenseLevel,
  matchesOfficiated,
  modalities,
  umpireCategories,
}: ProfileCardProps) {
  const t = useTranslations("explore");
  const tUmpire = useTranslations("umpire");
  const locale = useLocale();
  const router = useRouter();

  const handleViewProfile = () =>
    router.push(`/${locale}/profile/${username.replace(/\./g, "/")}`);

  const colors = ROLE_COLORS[role] || ROLE_COLORS.PLAYER;
  const isUmpire = role === Role.UMPIRE;
  const umpireTags = [
    ...(modalities ?? []).map((m) => tUmpire(`modalities.${m}`)),
    ...(umpireCategories ?? []).map((c) => tUmpire(`categories.${c}`)),
  ];

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`${colors.bg} rounded-xl p-4 hover:shadow-lg group mb-6`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        {/* Profile Info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="relative w-14 h-14 shrink-0 rounded-full overflow-hidden">
            <Image
              src={avatar || "/user.png"}
              alt={name}
              fill
              className="object-cover cursor-pointer"
              sizes="56px"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium text-foreground truncate">{name}</h3>
              <CountryLabel value={country} showName={false} className="shrink-0" />
              <Badge className={`${colors.badge}`}>{role}</Badge>
              {isUmpire && isVerified && (
                <BadgeCheck
                  className="w-4 h-4 text-accent shrink-0"
                  data-testid="verified-badge"
                />
              )}
            </div>
            {isUmpire ? (
              <>
                {licenseLevel && (
                  <p className="text-sm text-foreground-muted mb-1 truncate">
                    {tUmpire(`licenseLevels.${licenseLevel}`)}
                  </p>
                )}
                {matchesOfficiated !== null && matchesOfficiated !== undefined && (
                  <div className="flex items-center gap-2">
                    <Star size={14} className="text-warning shrink-0" />
                    <span className="text-xs text-foreground-muted">
                      {t("matchesCount", { count: matchesOfficiated })}
                    </span>
                  </div>
                )}
                {umpireTags.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5 mt-1.5">
                    {umpireTags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full border border-primary/40 bg-background/60 px-2 py-0.5 text-xs text-foreground"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <>
                <p className="text-sm text-foreground-muted mb-1 truncate">
                  {position}
                </p>
                <div className="flex items-center gap-2">
                  <Star size={14} className="text-warning shrink-0" />
                  <span className="text-xs text-foreground-muted">
                    {level} {t("level")}
                  </span>
                </div>
              </>
            )}
            <p className="text-xs text-foreground-muted mt-1 line-clamp-1">
              {bio}
            </p>
            <div className="flex items-center gap-1 text-xs text-foreground-muted mt-1">
              <MapPin size={12} />
              <CountryLabel city={city} value={country} />
            </div>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleViewProfile}
          className="w-full sm:w-auto sm:shrink-0 px-4 py-2.5 rounded-lg bg-background text-foreground font-medium cursor-pointer group-hover:shadow-lg flex items-center justify-center gap-2"
        >
          {t("viewProfile")}
          <ArrowRight
            size={16}
            className="group-hover:translate-x-1 transition-transform"
          />
        </motion.button>
      </div>
    </motion.div>
  );
}
