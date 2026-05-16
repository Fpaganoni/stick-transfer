"use client";

import {
  Edit,
  UserPlus,
  UserCheck,
  MessageCircle,
  Download,
  Loader2,
  Move,
  Check,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useRef, useCallback, useEffect } from "react";
import { Badge } from "../ui/badge";
import { User } from "@/types/models/user";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  useFollowUser,
  useFollowMutation,
  useUnfollowMutation,
  useUpdateUser,
} from "@/hooks/useUsers";
import { mapRoleToEntityType } from "@/lib/utils/entity-type";
import { ProfileStats } from "./profile-stats";
import { CvSection } from "./cv-section";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
}: ProfileHeaderProps) {
  const t = useTranslations("profile");
  const { user: currentUser } = useAuthStore();
  const router = useRouter();

  const [isHoveringCover, setIsHoveringCover] = useState(false);
  const [isRepositioning, setIsRepositioning] = useState(false);
  const [coverPos, setCoverPos] = useState<number>(
    coverImagePosition ? parseFloat(coverImagePosition) : 50,
  );
  const [savedPos, setSavedPos] = useState<number>(
    coverImagePosition ? parseFloat(coverImagePosition) : 50,
  );
  const isDragging = useRef(false);
  const coverContainerRef = useRef<HTMLDivElement>(null);
  const updateUser = useUpdateUser();

  useEffect(() => {
    const pos = coverImagePosition ? parseFloat(coverImagePosition) : 50;
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

  const entityType = mapRoleToEntityType(role);
  const { data: followersData } = useFollowUser(entityType, id);
  const isFollowing = followersData?.followers?.some(
    (f: any) => f.followerId === currentUser?.id,
  );

  const followMutation = useFollowMutation();
  const unfollowMutation = useUnfollowMutation();

  const handleToggleFollow = () => {
    if (!currentUser) {
      toast.error("You must be logged in to follow users");
      return;
    }

    const followerId = currentUser.id;
    const followerType = mapRoleToEntityType(currentUser.role);
    const followingId = id;
    const followingType = entityType;

    if (isFollowing) {
      unfollowMutation.mutate(
        { followerId, followerType, followingId, followingType },
        {
          onSuccess: () => toast.success(`Unfollowed ${name}`),
          onError: () => toast.error("Failed to unfollow"),
        },
      );
    } else {
      followMutation.mutate(
        { followerId, followerType, followingId, followingType },
        {
          onSuccess: () => toast.success(`Now following ${name}`),
          onError: () => toast.error("Failed to follow"),
        },
      );
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
                className="w-32 h-32 rounded-full border-2 border-background shadow-lg relative overflow-hidden bg-muted"
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
              <div className="mt-1">
                <ProfileStats userId={id} userRole={role} />
              </div>

              <CvSection
                userId={id}
                role={role}
                cvUrl={cvUrl}
                isOwnProfile={isOwnProfile}
              />

              <p className="text-foreground-muted text-sm text-center mb-2 leading-relaxed">
                {bio || t("noBio")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {isOwnProfile ? (
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
          ) : (
            <div className="flex gap-4 justify-start ml-40">
              <motion.button
                onClick={handleToggleFollow}
                disabled={
                  followMutation.isPending || unfollowMutation.isPending
                }
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-3 rounded-full border-2 transition-colors flex items-center justify-center shadow-sm ${
                  isFollowing
                    ? "bg-primary text-foreground border-2 border-primary"
                    : "text-foreground border-primary hover:bg-primary-hover"
                }`}
                title={
                  isFollowing
                    ? t("unfollow", { fallback: "Unfollow" })
                    : t("follow")
                }
              >
                {followMutation.isPending || unfollowMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isFollowing ? (
                  <UserCheck className="w-5 h-5" />
                ) : (
                  <UserPlus className="w-5 h-5" />
                )}
              </motion.button>

              <motion.button
                onClick={handleMessage}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 rounded-full border-2 border-primary text-foreground hover:bg-primary transition-colors flex items-center justify-center shadow-sm"
                title={t("message")}
              >
                <MessageCircle className="w-5 h-5" />
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
          )}
        </div>
      </div>
    </div>
  );
}
