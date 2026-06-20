"use client";

import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface FollowersFollowingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "followers" | "following";
  users: Array<{ id: string; name: string; avatar?: string; username?: string }>;
  totalCount: number;
}

export function FollowersFollowingModal({
  isOpen,
  onClose,
  mode,
  users,
  totalCount,
}: FollowersFollowingModalProps) {
  const title = mode === "followers" ? "Seguidores" : "Siguiendo";
  const emptyText =
    mode === "followers" ? "No hay seguidores aún" : "No sigues a nadie aún";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative z-10 w-full max-w-md bg-background border border-border rounded-2xl shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">
                {title}{" "}
                <span className="text-foreground-muted font-normal">
                  ({totalCount})
                </span>
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-border/30 transition-colors"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto">
              {users.length === 0 ? (
                <p className="text-center text-foreground-muted text-sm py-10">
                  {emptyText}
                </p>
              ) : (
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
                        <span className="text-sm font-medium text-foreground truncate">
                          {user.name}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
