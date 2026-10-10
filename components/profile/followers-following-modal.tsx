"use client";

import { useEffect, useEffectEvent } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { FollowListMode, useFollowList } from "@/hooks/useUsers";
import type { UserBasicInfo } from "@/types/models/user";

const PLACEHOLDER_ROWS = 4;

interface FollowersFollowingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: FollowListMode;
  userId: string;
  totalCount: number;
}

function FollowListSkeleton({ label }: { label: string }) {
  return (
    <ul className="py-2" aria-busy="true" aria-label={label}>
      {Array.from({ length: PLACEHOLDER_ROWS }, (_, idx) => (
        <li key={idx} className="flex items-center gap-3 px-5 py-3">
          <Skeleton className="w-10 h-10 rounded-full shrink-0" />
          <Skeleton className="h-4 w-40" />
        </li>
      ))}
    </ul>
  );
}

function FollowListItems({ users, onClose }: { users: UserBasicInfo[]; onClose: () => void }) {
  return (
    <ul className="py-2">
      {users.map((user) => (
        <li key={user.id}>
          <Link
            href={`/profile/${user.username || user.id}`}
            onClick={onClose}
            className="flex items-center gap-3 px-5 py-3 hover:bg-border/30 transition-colors"
          >
            <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 bg-muted">
              <Image
                src={user.avatar || "/user.png"}
                alt={user.name}
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
            <span className="text-sm font-medium text-foreground truncate">{user.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * Followers / following of a user. The list is requested only while the modal
 * is open, and only its first page (FOLLOW_LIST_LIMIT); totalCount is the total.
 */
export function FollowersFollowingModal({
  isOpen,
  onClose,
  mode,
  userId,
  totalCount,
}: FollowersFollowingModalProps) {
  const t = useTranslations("profile");
  const { data: users, isLoading, isError } = useFollowList({
    userId,
    mode,
    enabled: isOpen,
  });

  const title = mode === "followers" ? t("followers") : t("following");
  const emptyText =
    mode === "followers" ? t("followList.emptyFollowers") : t("followList.emptyFollowing");

  const onEscape = useEffectEvent(() => {
    onClose();
  });

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEscape();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const renderList = () => {
    if (isLoading) return <FollowListSkeleton label={t("followList.loading")} />;
    if (isError) {
      return (
        <p role="alert" className="text-center text-foreground-muted text-sm py-10">
          {t("followList.error")}
        </p>
      );
    }
    if (!users?.length) {
      return <p className="text-center text-foreground-muted text-sm py-10">{emptyText}</p>;
    }
    return <FollowListItems users={users} onClose={onClose} />;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="button"
            tabIndex={0}
            aria-label={t("followList.close")}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onClose();
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative z-10 w-full max-w-md bg-background border border-border rounded-2xl shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">
                {title}{" "}
                <span className="text-foreground-muted font-normal">({totalCount})</span>
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-border/30 transition-colors"
                aria-label={t("followList.close")}
              >
                <X size={18} />
              </button>
            </div>

            {/* List */}
            <div className="max-h-[70vh] overflow-y-auto">{renderList()}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
