"use client";

import {
  Edit,
  UserPlus,
  UserCheck,
  MessageCircle,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { User } from "@/types/models/user";
import { Badge } from "../ui/badge";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  useFollowUser,
  useFollowMutation,
  useUnfollowMutation,
} from "@/hooks/useUsers";
import { mapRoleToEntityType } from "@/lib/utils/entity-type";
import { ProfileStats } from "./profile-stats";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ClubProfileHeaderProps = Pick<
  User,
  "id" | "name" | "role" | "avatar" | "coverImage" | "bio" | "country"
> & {
  city?: string;
  isVerified?: boolean;
  isOwnProfile?: boolean;
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
}: ClubProfileHeaderProps) {
  const t = useTranslations("clubProfile");
  const { user: currentUser } = useAuthStore();
  const router = useRouter();

  const entityType = mapRoleToEntityType(role);
  const { data: followersData } = useFollowUser(entityType, id);
  const isFollowing = followersData?.followers?.some(
    (f: any) => f.followerId === currentUser?.id,
  );

  const followMutation = useFollowMutation();
  const unfollowMutation = useUnfollowMutation();

  const handleToggleFollow = () => {
    if (!currentUser) {
      toast.error("You must be logged in to follow clubs");
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
      <div className="h-86 relative overflow-hidden">
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
                {isVerified && <CheckCircle className="w-6 h-6 text-success" />}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="club">{role}</Badge>
              </div>

              {(city || country) && (
                <p className="text-foreground-muted text-sm font-medium mt-1">
                  {[city, country].filter(Boolean).join(", ") || "🌍"}
                </p>
              )}

              <div className="mt-2">
                <ProfileStats userId={id} userRole={role} />
              </div>

              <p className="text-foreground-muted text-sm text-center mb-2 leading-relaxed mt-2">
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
                title={isFollowing ? "Unfollow" : "Follow"}
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
                title="Message"
              >
                <MessageCircle className="w-5 h-5" />
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
