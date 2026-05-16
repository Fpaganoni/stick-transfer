"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Users, Briefcase, MapPin } from "lucide-react";

interface ClubData {
  id: string;
  bio?: string;
  city?: string;
  country?: string;
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

  const tabs = [
    { id: "squad", label: t("tabs.squad") },
    { id: "opportunities", label: t("tabs.opportunities") },
    { id: "about", label: t("tabs.about") },
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
        {activeTab === "squad" && (
          <div className="py-12">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full text-center border-2 border-dashed border-border rounded-xl p-8"
            >
              <Users className="mx-auto mb-3 text-foreground-muted" size={40} />
              <p className="text-foreground-muted font-medium">
                {t("squad.noMembers")}
              </p>
            </motion.div>
          </div>
        )}

        {activeTab === "opportunities" && (
          <div className="py-12">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full text-center border-2 border-dashed border-border rounded-xl p-8"
            >
              <Briefcase
                className="mx-auto mb-3 text-foreground-muted"
                size={40}
              />
              <p className="text-foreground-muted font-medium">
                {t("opportunities.noOpportunities")}
              </p>
            </motion.div>
          </div>
        )}

        {activeTab === "about" && (
          <div className="space-y-4 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-background rounded-xl p-6 border border-border"
            >
              <h3 className="font-bold text-foreground text-lg mb-4">
                {t("about.title")}
              </h3>

              {(clubData.city || clubData.country) && (
                <div className="flex items-start gap-3 mb-4">
                  <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
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

              {clubData.bio && (
                <div className="border-t border-border pt-4">
                  <p className="text-foreground-muted text-sm font-medium mb-2">
                    Description
                  </p>
                  <p className="text-foreground text-sm leading-relaxed">
                    {clubData.bio}
                  </p>
                </div>
              )}

              {!clubData.bio && !(clubData.city || clubData.country) && (
                <p className="text-foreground-muted text-sm text-center py-4">
                  {t("noBio")}
                </p>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </>
  );
}
