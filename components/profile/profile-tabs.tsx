"use client";

import { motion } from "framer-motion";
import { TrajectoryItem } from "@/types/models/user";
import { useTranslations } from "next-intl";
import { YoutubeWidget } from "@/components/ui/youtube-widget";
import { UserApplications } from "./user-applications";
import { UserSavedJobs } from "./user-saved-jobs";
import { Download, FileText } from "lucide-react";

interface UserData {
  id: string;
  role?: string;
  cvUrl?: string;
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

  const showCvTab =
    userData.role?.toUpperCase() === "PLAYER" ||
    userData.role?.toUpperCase() === "COACH";

  const tabs = [
    { id: "trajectory", label: t("tabs.trajectory") },
    { id: "multimedia", label: t("tabs.multimedia") },
    ...(showCvTab ? [{ id: "cv", label: t("tabs.cv") }] : []),
    ...(isOwnProfile
      ? [
          { id: "applications", label: t("tabs.applications") },
          { id: "savedJobs", label: t("tabs.savedJobs") },
        ]
      : []),
  ];

  return (
    <>
      <div className="relative bg-background border-t border-border z-20">
        <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-1 px-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 snap-start text-foreground-muted py-4 px-4 font-medium text-center border-b-2 transition-colors duration-200 cursor-pointer whitespace-nowrap hover:text-foreground ${
                activeTab === tab.id
                  ? "border-b-primary text-primary font-bold"
                  : "border-b-transparent text-foreground-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-linear-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-linear-to-l from-background to-transparent" />
      </div>

      <div className="px-4 py-6">
        {activeTab === "trajectory" && (
          <div className="space-y-4">
            {userData.trajectories && userData.trajectories.length > 0 ? (
              userData.trajectories.map((item, idx) => (
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
              ))
            ) : (
              <div className="py-8 text-center border-2 border-dashed border-border rounded-xl">
                <p className="text-foreground-muted font-medium">
                  {t("noTrajectory")}
                </p>
              </div>
            )}
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

        {activeTab === "cv" && (
          <div className="space-y-4">
            {userData.cvUrl ? (
              <>
                <iframe
                  src={`${userData.cvUrl}#zoom=75`}
                  className="w-full h-screen p-10 rounded-xl border border-border"
                  title="CV Preview"
                />
                <a
                  href={userData.cvUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 border border-border text-primary font-semibold transition-colors duration-200"
                >
                  <Download size={16} />
                  {t("cv.download")}
                </a>
              </>
            ) : (
              <div className="py-8 text-center border-2 border-dashed border-border rounded-xl">
                <FileText
                  size={32}
                  className="mx-auto mb-3 text-foreground-muted opacity-40"
                />
                <p className="text-foreground-muted font-medium">
                  {t("cv.noCv")}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "applications" && <UserApplications />}

        {activeTab === "savedJobs" && <UserSavedJobs />}
      </div>
    </>
  );
}
