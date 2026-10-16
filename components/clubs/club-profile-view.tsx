"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { Loader } from "@/components/ui/loader";
import { Error as ErrorMessage } from "@/components/ui/error";
import { ClubOnboardingNotice } from "@/components/clubs/club-onboarding-notice";
import { ClubProfileDetails } from "@/components/clubs/club-profile-details";
import { ClubProfileHeader } from "@/components/clubs/club-profile-header";
import { ClubVacanciesTab } from "@/components/clubs/club-vacancies-tab";
import { ClubVisitorPrompt } from "@/components/clubs/club-visitor-prompt";
import { VerificationBanner } from "@/components/clubs/verification-banner";
import { VerificationModal } from "@/components/clubs/verification-modal";
import { OpportunityDetailModal } from "@/components/opportunities/opportunity-detail-modal";
import { useClub } from "@/hooks/useClubs";
import { canPublishVacancies } from "@/lib/club-publishing";
import { nextTabIndex } from "@/lib/tab-keyboard";
import { useAuthStore } from "@/stores/useAuthStore";

type ClubProfileTab = "profile" | "vacancies";

const TABS: ClubProfileTab[] = ["profile", "vacancies"];

interface ClubProfileViewProps {
  clubId: string;
  /** "owner" is the club looking at itself; "public" is anyone else. */
  mode: "owner" | "public";
}

/**
 * The one club profile. A CLUB account IS the club, so /profile, /clubs/[id] and
 * /profile/[username] all render this view; only the actions differ by mode.
 */
export function ClubProfileView({ clubId, mode }: ClubProfileViewProps) {
  const t = useTranslations("clubProfile");
  const tClubs = useTranslations("clubs");
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const { data, isLoading, error } = useClub(clubId);
  const [activeTab, setActiveTab] = useState<ClubProfileTab>("profile");
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const tabRefs = useRef<Partial<Record<ClubProfileTab, HTMLButtonElement | null>>>({});

  // Roving tabindex: the arrows select and focus the neighbour, Tab leaves the list
  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, tab: ClubProfileTab) => {
    const next = nextTabIndex(event.key, TABS.indexOf(tab), TABS.length);
    if (next === null) return;
    event.preventDefault();
    setActiveTab(TABS[next]);
    tabRefs.current[TABS[next]]?.focus();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader>{tClubs("loading")}</Loader>
      </div>
    );
  }

  const club = data?.club;
  if (error || !club) {
    return (
      <div className="flex justify-center items-center h-screen">
        <ErrorMessage>{t("notFound")}</ErrorMessage>
      </div>
    );
  }

  const isOwner = mode === "owner";

  return (
    <>
      <main className="bg-overlay max-w-5xl mx-auto pb-24 overflow-x-hidden">
        {/* The first one to register a club name takes it: until it is verified
            the owner is asked, before anything else, for the document. */}
        {isOwner && (
          <div className="px-4 sm:px-6 pt-4">
            <VerificationBanner club={club} onVerifyClick={() => setIsVerificationOpen(true)} />
          </div>
        )}

        <ClubProfileHeader club={club} mode={mode} />

        <div className="px-4 sm:px-6">
          {isOwner && <ClubOnboardingNotice club={club} />}
          {!isOwner && !isLoggedIn && <ClubVisitorPrompt clubName={club.name} />}
        </div>

        <div
          role="tablist"
          aria-label={t("tabs.label")}
          className="flex bg-background border-t border-border sticky top-16 z-20 overflow-x-auto"
        >
          {TABS.map((tab) => (
            <button
              key={tab}
              ref={(element) => {
                tabRefs.current[tab] = element;
              }}
              role="tab"
              id={`club-tab-${tab}`}
              aria-selected={activeTab === tab}
              aria-controls={`club-panel-${tab}`}
              tabIndex={activeTab === tab ? 0 : -1}
              type="button"
              onClick={() => setActiveTab(tab)}
              onKeyDown={(event) => handleTabKeyDown(event, tab)}
              className={`flex-1 py-4 font-medium text-center border-b-2 border-l border-r transition-transform duration-300 cursor-pointer whitespace-nowrap min-w-fit ${
                activeTab === tab
                  ? "border-b-border-strong text-primary font-bold hover:text-primary shadow-lg"
                  : "border-b-transparent text-foreground-muted hover:text-foreground"
              }`}
            >
              {t(`tabs.${tab}`)}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id={`club-panel-${activeTab}`}
          aria-labelledby={`club-tab-${activeTab}`}
          className="px-4 sm:px-6 py-6"
        >
          {activeTab === "profile" ? (
            <ClubProfileDetails club={club} />
          ) : (
            <ClubVacanciesTab
              clubId={club.id}
              mode={mode}
              canPublish={canPublishVacancies(club.verificationStatus)}
            />
          )}
        </div>
      </main>

      <OpportunityDetailModal />

      {isOwner && isVerificationOpen && (
        <VerificationModal clubId={club.id} onClose={() => setIsVerificationOpen(false)} />
      )}
    </>
  );
}
