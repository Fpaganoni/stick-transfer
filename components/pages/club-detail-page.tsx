"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useClub } from "@/hooks/useClubs";
import { useJobOpportunities } from "@/hooks/useJobOpportunities";
import { useAuthStore } from "@/stores/useAuthStore";
import { Loader } from "@/components/ui/loader";
import { Error } from "@/components/ui/error";
import { ClubContactSection } from "@/components/clubs/club-contact-section";
import { VerificationBanner } from "@/components/clubs/verification-banner";
import { VerificationModal } from "@/components/clubs/verification-modal";
import { OpportunityListCard } from "@/components/opportunities/opportunity-list-card";
import { OpportunityDetailModal } from "@/components/opportunities/opportunity-detail-modal";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import Image from "next/image";
import { MapPin, CheckCircle, Briefcase } from "lucide-react";

interface ClubDetailPageProps {
  clubId: string;
}

export function ClubDetailPage({ clubId }: ClubDetailPageProps) {
  const t = useTranslations("clubs");
  const tClubProfile = useTranslations("clubProfile");
  const { user } = useAuthStore();
  const { data, isLoading, error } = useClub(clubId);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  const { data: vacanciesData, isLoading: vacanciesLoading } = useJobOpportunities(
    { clubId },
    undefined,
  );
  const vacancies = vacanciesData?.jobOpportunities ?? [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader>{t("loading")}</Loader>
      </div>
    );
  }

  if (error || !data?.club) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Error>Club not found</Error>
      </div>
    );
  }

  const club = data.club;

  // Check if user is admin of this club
  const isClubAdmin = club.members?.some(
    (m) => m.user.id === user?.id && m.role.toUpperCase() === "ADMIN",
  );

  return (
    <>
      <main className="bg-overlay max-w-5xl mx-auto pb-24 overflow-x-hidden">
        {/* Cover image */}
        <div className="relative h-48 sm:h-80 bg-linear-to-b from-primary/10 to-background overflow-hidden">
          {club.coverImage ? (
            <Image
              src={club.coverImage}
              alt={club.name}
              fill
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary/5" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/50 to-transparent" />
        </div>

        {/* Club info */}
        <div className="px-4 sm:px-6">
          {/* Logo + Title section */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 -mt-10 sm:-mt-16 mb-6 sm:mb-8 relative z-10">
            {/* Logo */}
            {club.logo && (
              <div className="shrink-0">
                <Image
                  src={club.logo}
                  alt={club.name}
                  width={120}
                  height={120}
                  className="w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-background shadow-lg"
                />
              </div>
            )}

            {/* Title con badge */}
            <div className="flex-1 min-w-0 sm:pb-2">
              <div className="flex items-center gap-3 mb-2 min-w-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground min-w-0 wrap-break-word">
                  {club.name}
                </h1>
                {club.isVerified && (
                  <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0" />
                )}
              </div>
            </div>
          </div>

          {/* Verification banner - only show to admin */}
          {isClubAdmin && (
            <VerificationBanner
              club={club}
              onVerifyClick={() => setIsVerificationModalOpen(true)}
            />
          )}

          {/* Ubicación */}
          {(club.city || club.country) && (
            <div className="flex items-center gap-2 text-foreground/70 mb-6 text-base">
              <MapPin className="w-5 h-5 shrink-0" />
              <span>
                {[club.city, club.country].filter(Boolean).join(", ")}
              </span>
            </div>
          )}

          {/* Descripción */}
          {club.description && (
            <p className="text-foreground/80 text-base mb-12 leading-relaxed max-w-3xl">
              {club.description}
            </p>
          )}

          {/* Contacto y Redes */}
          <ClubContactSection club={club} />

          {/* Vacantes */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-foreground mb-6 font-sans">
              {tClubProfile("opportunities.title")}
            </h2>

            {vacanciesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-24 rounded-xl bg-surface-elevated animate-pulse"
                  />
                ))}
              </div>
            ) : vacancies.length === 0 ? (
              <Empty className="border border-dashed border-border">
                <EmptyMedia variant="icon">
                  <Briefcase />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>
                    {tClubProfile("opportunities.noOpportunities")}
                  </EmptyTitle>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="space-y-3">
                {vacancies.map((opportunity) => (
                  <OpportunityListCard key={opportunity.id} {...opportunity} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <OpportunityDetailModal />

      {/* Verification Modal */}
      {isVerificationModalOpen && (
        <VerificationModal
          clubId={clubId}
          onClose={() => setIsVerificationModalOpen(false)}
        />
      )}
    </>
  );
}
