"use client";

import { motion } from "framer-motion";
import { TrajectoryItem, UserStats } from "@/types/models/user";
import { useTranslations } from "next-intl";
import { YoutubeWidget } from "@/components/ui/youtube-widget";
import { UserApplications } from "./user-applications";

interface UserData {
  id: string;
  stats: UserStats;
  trajectories: TrajectoryItem[];
  multimedia?: string[];
}

interface ProfileTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userData: UserData;
  isOwnProfile?: boolean;
}

export function ProfileTabs({
  activeTab,
  setActiveTab,
  userData,
  isOwnProfile = false,
}: ProfileTabsProps) {
  const t = useTranslations("profile");

  const tabs = [
    { id: "trajectory", label: t("tabs.trajectory") },
    { id: "multimedia", label: t("tabs.multimedia") },
    { id: "statistics", label: t("tabs.statistics") },
    ...(isOwnProfile
      ? [{ id: "applications", label: t("tabs.applications") }]
      : []),
  ];

  return (
    <>
      <div className="flex bg-background border-t border-border sticky top-16 z-20 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 text-foreground-muted py-4 font-medium text-center border-b-2 border-l border-r transition-transform duration-300 cursor-pointer whitespace-nowrap min-w-fit hover:text-foreground ${
              activeTab === tab.id
                ? "border-b-border-strong border-b-2 text-primary font-bold hover:text-primary shadow-lg"
                : "border-b-transparent text-foreground-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-4 py-6">
        {activeTab === "trajectory" && (
          <div className="space-y-4">
            {userData.trajectories.map((item, idx) => (
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                key={idx}
                className="bg-background rounded-xl py-4 px-8 border border-border hover:shadow-lg group"
              >
                <h3 className="font-semibold text-foreground text-lg mb-1 transition-colors">
                  {item.club?.name || item.title}
                </h3>
                <p className="text-foreground-muted text-sm font-medium mb-2">
                  {item.period}
                </p>
                <p className="text-foreground-muted text-sm">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === "multimedia" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userData.multimedia && userData.multimedia.length > 0 ? (
              userData.multimedia.map((url, i) => (
                <YoutubeWidget
                  key={i}
                  url={url}
                  title={`Video highlight ${i + 1}`}
                />
              ))
            ) : (
              <div className="col-span-full py-8 text-center border-2 border-dashed border-border rounded-xl">
                <p className="text-foreground-muted font-medium">
                  No multimedia available
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "statistics" && (
          <div className="grid grid-cols-3 gap-3 pb-6">
            <motion.div
              whileHover={{ scale: 1.04 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="rounded-xl p-4 border border-border-strong text-center hover:border-primary transition-colors duration-300 hover:shadow-lg cursor-pointer"
            >
              <p className="text-3xl font-bold text-info">
                {userData.stats.gamesPlayed}
              </p>
              <p className="text-foreground-muted text-sm mt-2 font-medium">
                {t("stats.gamesPlayed")}
              </p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.04 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="rounded-xl p-4 border border-border-strong text-center hover:border-primary transition-colors duration-300 hover:shadow-lg cursor-pointer"
            >
              <p className="text-3xl font-bold text-success">
                {userData.stats.goals}
              </p>
              <p className="text-foreground-muted text-sm mt-2 font-medium">
                {t("stats.goals")}
              </p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.04 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="rounded-xl p-4 border border-border-strong text-center hover:border-primary transition-colors duration-300 hover:shadow-lg cursor-pointer"
            >
              <p className="text-3xl font-bold text-warning">
                {userData.stats.assists}
              </p>
              <p className="text-foreground-muted text-sm mt-2 font-medium">
                {t("stats.assists")}
              </p>
            </motion.div>
          </div>
        )}

        {activeTab === "applications" && <UserApplications />}
      </div>
    </>
  );
}
