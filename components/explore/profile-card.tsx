"use client";

import Image from "next/image";

// Keep existing imports below...
import { ArrowRight, MapPin, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { User } from "@/types/models/user";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";

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
>;

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
}: ProfileCardProps) {
  const t = useTranslations("explore");
  const locale = useLocale();
  const router = useRouter();

  const handleViewProfile = () =>
    router.push(`/${locale}/profile/${username.replace(/\./g, "/")}`);

  const roleColors: Record<
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
    CLUB: {
      bg: "bg-info/20",
      text: "text-info",
      badge: "bg-info/20 text-foreground border-info",
    },
  };

  const colors = roleColors[role] || roleColors.PLAYER;

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`${colors.bg} rounded-xl p-4 hover:shadow-lg group mb-6`}
    >
      <div className="flex items-start justify-between gap-4">
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
              <span className="shrink-0">{country}</span>
              <Badge className={`${colors.badge}`}>{role}</Badge>
            </div>
            <p className="text-sm text-foreground-muted mb-1 truncate">
              {position}
            </p>
            <div className="flex items-center gap-2">
              <Star size={14} className="text-warning shrink-0" />
              <span className="text-xs text-foreground-muted">
                {level} {t("level")}
              </span>
            </div>
            <p className="text-xs text-foreground-muted mt-1 line-clamp-1">
              {bio}
            </p>
            <div className="flex items-center gap-1 text-xs text-foreground-muted mt-1">
              <MapPin size={12} />
              <span>
                {city}, {country}
              </span>
            </div>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleViewProfile}
          className="px-4 py-2 rounded-lg bg-background text-foreground font-medium cursor-pointer shrink-0 group-hover:shadow-lg flex items-center gap-2 min-w-fit"
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
