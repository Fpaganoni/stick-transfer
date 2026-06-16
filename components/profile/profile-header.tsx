"use client";

import {
  Edit,
  MessageCircle,
  Download,
  Move,
  Check,
  X,
  Loader2,
  Flag,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useRef, useCallback, useEffect } from "react";
import { Badge } from "../ui/badge";
import { User } from "@/types/models/user";
import { useUpdateUser, useFollow, useUnfollow } from "@/hooks/useUsers";
import { useAuthStore } from "@/stores/useAuthStore";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FollowersFollowingModal } from "./followers-following-modal";
import { ReportModal } from "./report-modal";

type ProfileHeaderProps = Pick<
  User,
  | "id"
  | "name"
  | "role"
  | "avatar"
  | "coverImage"
  | "coverImagePosition"
  | "position"
  | "country"
  | "bio"
  | "cvUrl"
> & {
  isOwnProfile?: boolean;
  username?: string;
  followers?: Array<{ id: string; name: string; avatar?: string; username?: string }>;
  following?: Array<{ id: string; name: string; avatar?: string; username?: string }>;
};

export function ProfileHeader({
  id,
  name,
  role,
  position,
  country,
  bio,
  avatar,
  coverImage,
  coverImagePosition,
  cvUrl,
  isOwnProfile = false,
  followers = [],
  following = [],
}: ProfileHeaderProps) {
  const t = useTranslations("profile");
  const router = useRouter();
  const { user: currentUser } = useAuthStore();

  const [isHoveringCover, setIsHoveringCover] = useState(false);
  const [isRepositioning, setIsRepositioning] = useState(false);
  const [coverPos, setCoverPos] = useState<number>(
    coverImagePosition ? parseFloat(coverImagePosition) : 50,
  );
  const [savedPos, setSavedPos] = useState<number>(
    coverImagePosition ? parseFloat(coverImagePosition) : 50,
  );
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followingModalOpen, setFollowingModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [isHoveringUnfollow, setIsHoveringUnfollow] = useState(false);

  const isDragging = useRef(false);
  const coverContainerRef = useRef<HTMLDivElement>(null);
  const updateUser = useUpdateUser();
  const followMutation = useFollow();
  const unfollowMutation = useUnfollow();

  const isFollowing = followers.some((f) => f.id === currentUser?.id);
  const isFollowPending = followMutation.isPending || unfollowMutation.isPending;

  useEffect(() => {
    const pos = coverImagePosition ? parseFloat(coverImagePosition) : 50;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCoverPos(pos);
    setSavedPos(pos);
  }, [coverImagePosition]);

  const handleCoverMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isRepositioning) return;
      isDragging.current = true;
      e.preventDefault();
    },
    [isRepositioning],
  );

  const handleCoverMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !coverContainerRef.current) return;
    const rect = coverContainerRef.current.getBoundingClientRect();
    const pct = Math.min(
      100,
      Math.max(0, ((e.clientY - rect.top) / rect.height) * 100),
    );
    setCoverPos(pct);
  }, []);

  const handleCoverMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleSavePosition = () => {
    updateUser.mutate(
      { id, coverImagePosition: `${Math.round(coverPos)}%` },
      {
        onSuccess: () => {
          setSavedPos(coverPos);
          setIsRepositioning(false);
          toast.success(
            t("coverPositionSaved", { fallback: "Cover position saved" }),
          );
        },
        onError: () =>
          toast.error(
            t("coverPositionError", { fallback: "Failed to save position" }),
          ),
      },
    );
  };

  const handleCancelReposition = () => {
    setCoverPos(savedPos);
    setIsRepositioning(false);
  };

  const handleFollowToggle = () => {
    if (!currentUser) return;
    const vars = {
      followerType: "USER",
      followerId: currentUser.id,
      followingType: "USER",
      followingId: id,
    };
    if (isFollowing) {
      unfollowMutation.mutate(vars, {
        onSuccess: () =>
          toast.success(t("unfollowed", { fallback: "Unfollowed" })),
        onError: () =>
          toast.error(
            t("followError", { fallback: "Failed to update follow status" }),
          ),
      });
    } else {
      followMutation.mutate(vars, {
        onSuccess: () =>
          toast.success(
            t("followed", { fallback: "Now following this user!" }),
          ),
        onError: () =>
          toast.error(
            t("followError", { fallback: "Failed to update follow status" }),
          ),
      });
    }
  };

  const handleMessage = () => {
    router.push(`/messages?userId=${id}&name=${encodeURIComponent(name)}`);
  };

  return (
    <div className="bg-background">
      <div
        ref={coverContainerRef}
        className={`h-86 relative overflow-hidden ${isRepositioning ? "cursor-ns-resize" : ""}`}
        onMouseEnter={() => setIsHoveringCover(true)}
        onMouseLeave={() => {
          setIsHoveringCover(false);
          isDragging.current = false;
        }}
        onMouseDown={handleCoverMouseDown}
        onMouseMove={handleCoverMouseMove}
        onMouseUp={handleCoverMouseUp}
      >
        <Image
          src={coverImage || "/hockey-stadium.jpg"}
          alt="Cover"
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: `center ${coverPos}%` }}
          draggable={false}
        />
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/10 to-transparent z-10 pointer-events-none" />

        {isOwnProfile && !isRepositioning && isHoveringCover && (
          <motion.button
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            onClick={() => setIsRepositioning(true)}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white backdrop-blur-md bg-black/40 hover:bg-black/60 transition-colors"
          >
            <Move size={14} />
            {t("repositionCover", { fallback: "Reposition" })}
          </motion.button>
        )}

        {isRepositioning && (
          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleCancelReposition}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white backdrop-blur-md bg-black/40 hover:bg-black/60 transition-colors"
            >
              <X size={14} />
              {t("cancel", { fallback: "Cancel" })}
            </motion.button>
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleSavePosition}
              disabled={updateUser.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white backdrop-blur-md bg-primary/80 hover:bg-primary transition-colors disabled:opacity-50"
            >
              {updateUser.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
              {t("save", { fallback: "Save" })}
            </motion.button>
          </div>
        )}

        {isRepositioning && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <p className="text-white text-sm font-medium backdrop-blur-md bg-black/30 px-3 py-1.5 rounded-lg">
              {t("dragToReposition", { fallback: "Drag to reposition" })}
            </p>
          </div>
        )}
      </div>

      <div className="px-4 pt-0 pb-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-start gap-3 flex-1 -mt-24 relative z-10">
            <div className="rounded-full shrink-0 mx-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="w-48 h-48 rounded-full border-2 border-background shadow-lg relative overflow-hidden bg-muted"
              >
                <Image
                  src={avatar || "/hockey-stadium.jpg"}
                  alt={name}
                  fill
                  priority
                  sizes="128px"
                  className="object-cover"
                />
              </motion.div>
            </div>
            <div className="pt-6">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">{name}</h1>
                <span className="text-2xl text-foreground-muted">
                  {country || "🌍"}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="player">{role}</Badge>
                <span className="text-foreground font-semibold text-sm">
                  {position || t("positionNotSet")}
                </span>
              </div>
              <p className="text-foreground-muted text-sm text-start my-2 leading-relaxed">
                {bio || t("noBio")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {isOwnProfile ? (
            <>
              <Link href="/profile/edit" className="w-[50%] mx-auto block">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="w-full flex items-center gap-2 justify-center h-(--input-button-height) px-4 py-2 bg-primary text-white-black font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 cursor-pointer disabled:opacity-50"
                >
                  <Edit size={18} />
                  {t("editProfile")}
                </motion.button>
              </Link>
              <div className="flex items-center gap-2 ml-40">
                <button
                  onClick={() => setFollowersModalOpen(true)}
                  className="text-sm text-foreground-muted hover:text-foreground hover:underline transition-colors"
                >
                  {followers.length} {t("followers")}
                </button>
                <span className="text-foreground-muted">·</span>
                <button
                  onClick={() => setFollowingModalOpen(true)}
                  className="text-sm text-foreground-muted hover:text-foreground hover:underline transition-colors"
                >
                  {following.length} {t("following")}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex gap-3 items-center ml-40">
                <motion.button
                  onClick={handleMessage}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 rounded-full border-2 border-primary text-foreground hover:bg-primary transition-colors flex items-center justify-center shadow-sm"
                  title={t("message")}
                >
                  <MessageCircle className="w-5 h-5" />
                </motion.button>

                <motion.button
                  onClick={handleFollowToggle}
                  disabled={isFollowPending}
                  onMouseEnter={() => isFollowing && setIsHoveringUnfollow(true)}
                  onMouseLeave={() => setIsHoveringUnfollow(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-center justify-center gap-2 h-(--input-button-height) px-4 rounded-lg text-sm font-semibold transition-colors duration-200 disabled:opacity-50 border-2 ${
                    isFollowing
                      ? isHoveringUnfollow
                        ? "bg-error border-error text-white"
                        : "bg-primary border-primary text-white-black"
                      : "bg-transparent border-primary text-foreground hover:bg-primary/10"
                  }`}
                >
                  {isFollowPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : isFollowing ? (
                    isHoveringUnfollow
                      ? t("unfollow", { fallback: "Unfollow" })
                      : t("following", { fallback: "Following" })
                  ) : (
                    t("follow", { fallback: "Follow" })
                  )}
                </motion.button>

                {cvUrl && (
                  <motion.a
                    href={cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-3 rounded-full border-2 border-primary text-foreground hover:bg-primary-hover transition-colors flex items-center justify-center shadow-sm"
                    title={t("cv.download", { fallback: "Download CV" })}
                  >
                    <Download className="w-5 h-5" />
                  </motion.a>
                )}
              </div>

              <div className="flex items-center gap-2 ml-40 mt-1">
                <button
                  onClick={() => setFollowersModalOpen(true)}
                  className="text-sm text-foreground-muted hover:text-foreground hover:underline transition-colors"
                >
                  {followers.length} {t("followers")}
                </button>
                <span className="text-foreground-muted">·</span>
                <button
                  onClick={() => setFollowingModalOpen(true)}
                  className="text-sm text-foreground-muted hover:text-foreground hover:underline transition-colors"
                >
                  {following.length} {t("following")}
                </button>
              </div>

              <div className="flex ml-40 mt-1">
                <button
                  onClick={() => setReportModalOpen(true)}
                  className="flex items-center gap-1 text-sm text-foreground-muted hover:text-error transition-colors"
                >
                  <Flag size={14} />
                  {t("report")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <FollowersFollowingModal
        isOpen={followersModalOpen}
        onClose={() => setFollowersModalOpen(false)}
        mode="followers"
        users={followers}
        totalCount={followers.length}
      />
      <FollowersFollowingModal
        isOpen={followingModalOpen}
        onClose={() => setFollowingModalOpen(false)}
        mode="following"
        users={following}
        totalCount={following.length}
      />
      {!isOwnProfile && (
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          targetId={id}
          targetType="USER"
        />
      )}
    </div>
  );
}
