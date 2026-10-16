"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { ChevronRight } from "lucide-react";
import { ClubCrest } from "@/components/clubs/club-crest";
import { Club } from "@/types/models/club";
import { CountryLabel } from "@/components/ui/country-label";

function isNew(createdAt?: string): boolean {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() < 30 * 24 * 60 * 60 * 1000;
}

export function ClubListCard(club: Club) {
  const locale = useLocale();
  const initials = club.name.slice(0, 2).toUpperCase();
  const showNew = isNew(club.createdAt);

  return (
    <Link
      href={`/${locale}/clubs/${club.id}`}
      className="relative flex flex-col items-center w-full h-[180px] sm:h-[200px] bg-surface border border-border rounded-xl p-3 cursor-pointer hover:border-primary/50 hover:shadow-md hover:scale-[1.02] transition duration-200"
    >
      {showNew && (
        <span className="absolute top-2 left-2 text-[10px] font-bold bg-error text-white px-1.5 py-0.5 rounded-full leading-none">
          NEW
        </span>
      )}

      <ChevronRight
        size={14}
        className="absolute top-2 right-2 text-foreground-muted"
      />

      {/* Crest: whole on a neutral background, never cropped to a circle */}
      <ClubCrest
        name={club.name}
        logo={club.logo}
        size={80}
        initials={initials}
        className="mt-4 mb-2 w-14 h-14 sm:w-20 sm:h-20 rounded-xl border-2 text-lg"
      />

      <p className="text-foreground font-semibold text-sm text-center line-clamp-2 leading-tight w-full">
        {club.name}
      </p>

      {club.country && (
        <div className="mt-1 text-sm text-foreground-muted">
          <CountryLabel value={club.country} />
        </div>
      )}
    </Link>
  );
}
