"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { MapPin, Briefcase, Globe, Mail, Video, Plus, X } from "lucide-react";
import { YoutubeWidget } from "@/components/ui/youtube-widget";
import { OpportunityListCard } from "@/components/opportunities/opportunity-list-card";
import { useJobOpportunities } from "@/hooks/useJobOpportunities";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ClubData {
  id: string;
  bio?: string;
  city?: string;
  country?: string;
  website?: string;
  email?: string;
  league?: string;
  type?: string;
  createdAt?: string;
  videos?: string[];
  isAdmin?: boolean;
}

interface ClubProfileTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  clubData: ClubData;
}

export function ClubProfileTabs({
  activeTab,
  setActiveTab,
  clubData,
}: ClubProfileTabsProps) {
  const t = useTranslations("clubProfile");
  const [videos, setVideos] = useState<string[]>(clubData.videos ?? []);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState("");

  const { data: vacanciesData, isLoading: vacanciesLoading } =
    useJobOpportunities({ clubId: clubData.id });

  const vacancies = vacanciesData?.jobOpportunities ?? [];

  const tabs = [
    { id: "profile", label: t("tabs.profile") },
    { id: "posts", label: t("tabs.posts") },
    { id: "vacancies", label: t("tabs.vacancies") },
    { id: "videos", label: t("tabs.videos") },
  ];

  const handleAddVideo = () => {
    const trimmed = newVideoUrl.trim();
    if (!trimmed) return;
    // TODO: persist via GraphQL mutation when backend supports club.videos[]
    setVideos((prev) => [...prev, trimmed]);
    setNewVideoUrl("");
    setIsAddModalOpen(false);
  };

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
        {activeTab === "profile" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 max-w-2xl"
          >
            <div className="bg-background rounded-xl p-6 border border-border">
              <h3 className="font-bold text-foreground text-lg mb-4">
                {t("about.title")}
              </h3>

              {(clubData.city || clubData.country) && (
                <div className="flex items-start gap-3 mb-4">
                  <MapPin className="w-5 h-5 text-primary shrink-0 mt-1" />
                  <div>
                    <p className="text-foreground-muted text-sm font-medium">
                      {t("about.location")}
                    </p>
                    <p className="text-foreground text-sm">
                      {[clubData.city, clubData.country]
                        .filter(Boolean)
                        .join(", ") || t("about.noLocation")}
                    </p>
                  </div>
                </div>
              )}

              {clubData.league && (
                <div className="flex items-start gap-3 mb-4">
                  <Briefcase className="w-5 h-5 text-primary shrink-0 mt-1" />
                  <div>
                    <p className="text-foreground-muted text-sm font-medium">
                      {t("profile.category")}
                    </p>
                    <p className="text-foreground text-sm">{clubData.league}</p>
                  </div>
                </div>
              )}

              {clubData.createdAt && (
                <div className="flex items-start gap-3 mb-4">
                  <Briefcase className="w-5 h-5 text-primary shrink-0 mt-1" />
                  <div>
                    <p className="text-foreground-muted text-sm font-medium">
                      {t("profile.founded")}
                    </p>
                    <p className="text-foreground text-sm">
                      {new Date(clubData.createdAt).getFullYear()}
                    </p>
                  </div>
                </div>
              )}

              {clubData.website && (
                <div className="flex items-start gap-3 mb-4">
                  <Globe className="w-5 h-5 text-primary shrink-0 mt-1" />
                  <div>
                    <p className="text-foreground-muted text-sm font-medium">
                      {t("profile.website")}
                    </p>
                    <a
                      href={clubData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-sm hover:underline"
                    >
                      {clubData.website}
                    </a>
                  </div>
                </div>
              )}

              {clubData.email && (
                <div className="flex items-start gap-3 mb-4">
                  <Mail className="w-5 h-5 text-primary shrink-0 mt-1" />
                  <div>
                    <p className="text-foreground-muted text-sm font-medium">
                      {t("profile.email")}
                    </p>
                    <a
                      href={`mailto:${clubData.email}`}
                      className="text-primary text-sm hover:underline"
                    >
                      {clubData.email}
                    </a>
                  </div>
                </div>
              )}

              {clubData.bio && (
                <div className="border-t border-border pt-4">
                  <p className="text-foreground-muted text-sm font-medium mb-2">
                    {t("profile.description")}
                  </p>
                  <p className="text-foreground text-sm leading-relaxed">
                    {clubData.bio}
                  </p>
                </div>
              )}

              {!clubData.bio &&
                !(clubData.city || clubData.country) &&
                !clubData.website &&
                !clubData.email && (
                  <p className="text-foreground-muted text-sm text-center py-4">
                    {t("noBio")}
                  </p>
                )}
            </div>
          </motion.div>
        )}

        {activeTab === "posts" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-surface-elevated/30 rounded-xl p-8"
          >
            <p className="text-foreground-muted text-center text-sm">
              {t("posts.noPosts")}
            </p>
          </motion.div>
        )}

        {activeTab === "vacancies" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            {vacanciesLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 rounded-xl bg-surface-elevated animate-pulse"
                />
              ))
            ) : vacancies.length === 0 ? (
              <Empty className="border border-dashed border-border">
                <EmptyMedia variant="icon">
                  <Briefcase />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>{t("vacancies.noVacancies")}</EmptyTitle>
                </EmptyHeader>
              </Empty>
            ) : (
              vacancies.map((opportunity) => (
                <OpportunityListCard key={opportunity.id} {...opportunity} />
              ))
            )}
          </motion.div>
        )}

        {activeTab === "videos" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {clubData.isAdmin && (
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white-black font-semibold rounded-lg hover:bg-primary-hover transition-colors text-sm"
                >
                  <Plus size={16} />
                  {t("videos.addVideo")}
                </button>
              </div>
            )}

            {videos.length === 0 ? (
              <Empty className="border border-dashed border-border">
                <EmptyMedia variant="icon">
                  <Video />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>{t("videos.noVideos")}</EmptyTitle>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {videos.map((url, i) => (
                  <YoutubeWidget key={i} url={url} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("videos.addVideoTitle")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <input
              type="url"
              value={newVideoUrl}
              onChange={(e) => setNewVideoUrl(e.target.value)}
              placeholder={t("videos.videoUrlPlaceholder")}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyDown={(e) => e.key === "Enter" && handleAddVideo()}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="flex items-center gap-1 px-4 py-2 rounded-lg border border-border text-foreground text-sm hover:bg-surface-elevated transition-colors"
              >
                <X size={14} />
                {t("videos.cancel")}
              </button>
              <button
                onClick={handleAddVideo}
                className="px-4 py-2 bg-primary text-white-black font-semibold rounded-lg hover:bg-primary-hover transition-colors text-sm"
              >
                {t("videos.save")}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
