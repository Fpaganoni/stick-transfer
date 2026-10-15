"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { BadgeCheck, Edit, MapPin, MoreHorizontal, Share2 } from "lucide-react";
import { CountryLabel } from "@/components/ui/country-label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReportModal } from "@/components/profile/report-modal";
import { useClubFollow } from "@/hooks/useClubFollow";
import { useRole } from "@/hooks/useRole";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUIStore } from "@/stores/useUIStore";
import type { Club } from "@/types/models/club";

const CREST_SIZES = "(min-width: 768px) 160px, (min-width: 640px) 144px, 112px";

const actionButton =
  "inline-flex items-center justify-center gap-2 h-(--input-button-height) px-4 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50";

interface ClubProfileHeaderProps {
  club: Club;
  mode: "owner" | "public";
}

/** The stored cover position is a vertical percentage such as "40%". */
function coverObjectPosition(position: string | null | undefined): string | undefined {
  const match = /^(\d{1,3})%$/.exec(position ?? "");
  return match ? `50% ${Math.min(100, Number(match[1]))}%` : undefined;
}

export function ClubProfileHeader({ club, mode }: ClubProfileHeaderProps) {
  const t = useTranslations("clubProfile");
  const router = useRouter();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const { openLoginModal } = useUIStore();
  const { isClub, isSuperAdmin } = useRole();
  const { isFollowing, canFollow, isPending, toggle } = useClubFollow(club);
  const [reportOpen, setReportOpen] = useState(false);

  const isOwner = mode === "owner";
  const clubInitial = Array.from(club.name.trim())[0]?.toUpperCase() ?? "?";
  const username = club.user?.username;
  // Follow and report are for someone else's club; the owner never sees them
  const showFollow = !isOwner && (!isLoggedIn || canFollow);
  const showReport = !isOwner && isLoggedIn && canFollow;
  const showContact = !isOwner && (isClub || isSuperAdmin);
  const showMenu = showReport || showContact;

  const handleFollow = () => {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }
    toggle();
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: club.name, url: window.location.href });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        toast.success(t("header.linkCopied"));
      }
    } catch {
      /* the visitor dismissed the share sheet */
    }
  };

  const handleContact = () => {
    router.push(`/messages?userId=${club.id}&name=${encodeURIComponent(club.name)}`);
  };

  return (
    <header>
      <div className="relative h-48 sm:h-80 bg-linear-to-b from-primary/10 to-background overflow-hidden">
        {club.coverImage ? (
          <Image
            src={club.coverImage}
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 1024px, 100vw"
            style={{ objectPosition: coverObjectPosition(club.coverImagePosition) }}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary/5" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/50 to-transparent" />
      </div>

      <div className="px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 -mt-14 sm:-mt-20 md:-mt-24 mb-6 relative z-10">
          {/* Crest: contained, never cropped to a circle */}
          <div className="shrink-0 size-28 sm:size-36 md:size-40 rounded-2xl bg-background border border-border shadow-lg overflow-hidden">
            {club.logo ? (
              <Image
                src={club.logo}
                alt={club.name}
                width={160}
                height={160}
                priority
                sizes={CREST_SIZES}
                className="size-full object-contain p-2 sm:p-3"
              />
            ) : (
              <div
                role="img"
                aria-label={club.name}
                className="size-full flex items-center justify-center bg-surface-elevated text-foreground-muted text-4xl sm:text-5xl font-bold"
              >
                <span aria-hidden>{clubInitial}</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 sm:pb-2">
            <div className="flex items-center gap-3 mb-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground min-w-0 wrap-break-word">
                {club.name}
              </h1>
              {/* Only the presence of the badge says "verified"; nothing is shown otherwise */}
              {club.isVerified && (
                <BadgeCheck
                  aria-label={t("header.verified")}
                  data-testid="verified-badge"
                  className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0"
                />
              )}
            </div>
            {username && <p className="text-foreground-muted text-sm">@{username}</p>}
            {(club.city || club.country) && (
              <p className="flex items-center gap-2 text-foreground/70 mt-1 text-sm">
                <MapPin aria-hidden className="w-4 h-4 shrink-0" />
                <CountryLabel city={club.city} value={club.country} />
              </p>
            )}
            {club.followersCount !== undefined && (
              <p className="text-foreground-muted text-sm mt-1">
                {t("header.followers", { count: club.followersCount })}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isOwner && (
              <Link
                href="/profile/edit"
                className={`${actionButton} bg-primary text-white-black hover:bg-primary-hover`}
              >
                <Edit aria-hidden size={18} />
                {t("editProfile")}
              </Link>
            )}
            {showFollow && (
              <button
                type="button"
                onClick={handleFollow}
                disabled={isPending}
                className={
                  isFollowing
                    ? `${actionButton} border border-border text-foreground hover:bg-surface-elevated`
                    : `${actionButton} bg-primary text-white-black hover:bg-primary-hover`
                }
              >
                {isFollowing ? t("header.unfollow") : t("header.follow")}
              </button>
            )}
            <button
              type="button"
              onClick={handleShare}
              className={`${actionButton} border border-border text-foreground hover:bg-surface-elevated`}
            >
              <Share2 aria-hidden size={16} />
              {t("header.share")}
            </button>
            {showMenu && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={t("header.more")}
                    className={`${actionButton} border border-border text-foreground hover:bg-surface-elevated px-3`}
                  >
                    <MoreHorizontal aria-hidden className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {showContact && (
                    <DropdownMenuItem onClick={handleContact}>{t("header.contact")}</DropdownMenuItem>
                  )}
                  {showContact && showReport && <DropdownMenuSeparator />}
                  {showReport && (
                    <DropdownMenuItem className="text-error" onClick={() => setReportOpen(true)}>
                      {t("header.report")}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {showReport && (
        // A club account is reported on the CLUB axis, never as a USER
        <ReportModal
          isOpen={reportOpen}
          onClose={() => setReportOpen(false)}
          targetId={club.id}
          targetType="CLUB"
        />
      )}
    </header>
  );
}
