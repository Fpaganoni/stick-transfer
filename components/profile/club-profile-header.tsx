"use client";

import { Edit, BadgeCheck, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { User } from "@/types/models/user";
import { Badge } from "../ui/badge";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AvatarPhotoModal } from "../ui/avatar-photo-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

type ClubProfileHeaderProps = Pick<
  User,
  "id" | "name" | "role" | "avatar" | "coverImage" | "bio" | "country"
> & {
  city?: string;
  isVerified?: boolean;
  isOwnProfile?: boolean;
  memberCount?: number;
};

export function ClubProfileHeader({
  id,
  name,
  role,
  avatar,
  coverImage,
  bio,
  city,
  country,
  isVerified = false,
  isOwnProfile = false,
  memberCount,
}: ClubProfileHeaderProps) {
  const t = useTranslations("clubProfile");
  const router = useRouter();
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice(window.matchMedia("(hover: none)").matches);
  }, []);

  const handleMessage = () => {
    router.push(`/messages?userId=${id}&name=${encodeURIComponent(name)}`);
  };

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: name, url: window.location.href });
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="bg-background">
      <div className="h-48 sm:h-64 md:h-86 relative overflow-hidden">
        <Image
          src={coverImage || "/hockey-stadium.jpg"}
          alt="Cover"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/10 to-transparent z-10" />
      </div>

      <div className="px-4 pt-0 pb-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-start gap-3 flex-1 -mt-24 relative z-10">
            <div className="rounded-full shrink-0 mx-2">
              <motion.div
                whileHover={isTouchDevice ? {} : { scale: 1.05 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                onClick={() => setAvatarModalOpen(true)}
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-border shadow-lg relative overflow-hidden bg-muted cursor-pointer"
              >
                <Image
                  src={avatar || "/hockey-stadium.jpg"}
                  alt={name}
                  fill
                  priority
                  sizes="(max-width: 640px) 96px, 128px"
                  className="object-cover"
                />
              </motion.div>
            </div>
            <div className="pt-6 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap min-w-0 overflow-hidden">
                <h1 className="text-lg sm:text-2xl font-bold text-foreground min-w-0 truncate">{name}</h1>
                {isVerified && (
                  <BadgeCheck
                    className="w-5 h-5 sm:w-6 sm:h-6 text-accent shrink-0"
                    data-testid="verified-badge"
                  />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="club">{role}</Badge>
              </div>
              {memberCount !== undefined && (
                <p className="text-foreground-muted text-sm font-medium mt-1 truncate">
                  {memberCount} {t("header.members")}
                </p>
              )}
              {(city || country) && (
                <p className="text-foreground-muted text-sm font-medium mt-1 truncate">
                  {[city, country].filter(Boolean).join(", ") || "🌍"}
                </p>
              )}
              <p className="text-foreground-muted text-sm mb-2 leading-relaxed mt-2 line-clamp-2">
                {bio || t("noBio")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {isOwnProfile ? (
            <Link href="/profile/edit" className="w-[50%] mx-auto block">
              <motion.button
                whileHover={isTouchDevice ? {} : { scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="w-full flex items-center gap-2 justify-center h-(--input-button-height) px-4 py-2 bg-primary text-white-black font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 cursor-pointer disabled:opacity-50"
              >
                <Edit size={18} />
                {t("editProfile")}
              </motion.button>
            </Link>
          ) : (
            <div className="flex gap-3 justify-start ml-28 sm:ml-40">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    whileHover={isTouchDevice ? {} : { scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-3 rounded-full border-2 border-border text-foreground hover:bg-surface-elevated transition-colors flex items-center justify-center shadow-sm"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem>{t("header.follow")}</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare}>
                    {t("header.share")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleMessage}>
                    {t("header.contact")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-error">
                    {t("header.report")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
      <AvatarPhotoModal
        isOpen={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        src={avatar || "/hockey-stadium.jpg"}
        alt={name}
      />
    </div>
  );
}
