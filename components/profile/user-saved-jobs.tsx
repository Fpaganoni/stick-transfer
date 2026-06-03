"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Bookmark, MapPin, Briefcase, Loader2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useSavedJobsStore } from "@/stores/useSavedJobsStore";
import { useJobOpportunities } from "@/hooks/useJobOpportunities";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/date-utils";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

export function UserSavedJobs() {
  const t = useTranslations("profile");
  const tOpp = useTranslations("opportunities");
  const locale = useLocale() as "en" | "es" | "fr";
  const { savedIds, toggleSave, isSaved } = useSavedJobsStore();
  const { data, isLoading } = useJobOpportunities();

  const savedOpportunities = useMemo(() => {
    if (!data?.jobOpportunities) return [];
    return data.jobOpportunities.filter((opp) => savedIds.includes(opp.id));
  }, [data, savedIds]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (savedOpportunities.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Empty className="border border-dashed border-border">
          <EmptyMedia variant="icon">
            <Bookmark />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>{t("savedJobs.noSavedJobs")}</EmptyTitle>
            <EmptyDescription>{t("savedJobs.noSavedJobsHint")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      {savedOpportunities.map((opportunity, idx) => {
        const { id, title, club, country, city, positionType, level, status, createdAt } =
          opportunity;
        const normalizedStatus = status.toLowerCase() as "open" | "closed" | "filled";
        const saved = isSaved(id);

        return (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="bg-background rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <Link
              href={`/clubs/${club.id}`}
              className="block p-4"
            >
              <div className="flex gap-3 min-h-[100px]">
                {/* Club logo */}
                <div className="shrink-0">
                  {club.logo ? (
                    <Image
                      src={club.logo}
                      alt={club.name}
                      width={56}
                      height={56}
                      className="rounded-sm object-cover w-14 h-14"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-sm bg-primary/10 border border-border flex items-center justify-center text-lg font-bold text-primary">
                      {club.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground text-sm leading-tight truncate">
                          {title}
                        </h3>
                        <p className="text-primary text-xs font-medium mt-0.5">
                          {club.name}
                        </p>
                      </div>

                      {/* Unsave button — stop propagation so Link doesn't fire */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleSave(id);
                        }}
                        className={`shrink-0 p-1 rounded hover:bg-foreground/10 transition-colors ${
                          saved ? "text-primary" : "text-foreground-muted"
                        }`}
                        aria-label="Remove bookmark"
                      >
                        <Bookmark
                          size={16}
                          fill={saved ? "currentColor" : "none"}
                        />
                      </button>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <div className="flex items-center gap-1 text-xs text-foreground-muted">
                        <MapPin size={11} />
                        <span>
                          {[city, country].filter(Boolean).join(", ")}
                        </span>
                      </div>
                      {positionType && (
                        <span className="text-xs text-foreground-muted">
                          · {positionType}
                        </span>
                      )}
                      {level && (
                        <Badge
                          className={`text-xs py-0 px-1.5 ${
                            level.toLowerCase() === "professional"
                              ? "bg-info/20 text-info border-info/30"
                              : "bg-warning/20 text-warning border-warning/30"
                          }`}
                        >
                          {level}
                        </Badge>
                      )}
                      {normalizedStatus !== "open" && (
                        <Badge className="text-xs py-0 px-1.5 bg-error/20 text-error border-error/30">
                          {tOpp("filled")}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-foreground-muted">
                      {tOpp("published")} {formatRelativeTime(createdAt, locale)}
                    </span>
                    <div className="flex items-center gap-1 text-xs font-semibold text-foreground-muted">
                      <Briefcase size={11} />
                      {t("savedJobs.viewClub")}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
