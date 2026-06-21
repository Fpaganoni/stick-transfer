"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import { Club } from "@/types/models/club";
import { cn } from "@/lib/utils";

const TYPE_STYLES: Record<NonNullable<Club["type"]>, string> = {
  Team: "bg-info/10 text-info",
  Organization: "bg-accent/10 text-accent",
  Brand: "bg-primary/10 text-primary",
};

function countryFlag(country?: string): string | null {
  if (!country || country.length !== 2) return null;
  return String.fromCodePoint(
    ...[...country.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}

function isNew(createdAt?: string): boolean {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() < 30 * 24 * 60 * 60 * 1000;
}

export function ClubListCard(club: Club) {
  const router = useRouter();
  const locale = useLocale();
  const flag = countryFlag(club.country);
  const initials = club.name.slice(0, 2).toUpperCase();
  const typeStyle = club.type ? TYPE_STYLES[club.type] : null;
  const showNew = isNew(club.createdAt);

  return (
    <div
      onClick={() => router.push(`/${locale}/clubs/${club.id}`)}
      className="relative flex flex-col items-center w-full h-[180px] sm:h-[200px] bg-surface border border-border rounded-xl p-3 cursor-pointer hover:border-primary/50 hover:shadow-md hover:scale-[1.02] transition-all duration-200"
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

      <div className="mt-4 mb-2 w-14 h-14 sm:w-20 sm:h-20 rounded-full border-2 border-border overflow-hidden flex items-center justify-center bg-primary/10 shrink-0">
        {club.logo ? (
          <Image
            src={club.logo}
            alt={club.name}
            width={80}
            height={80}
            className="object-cover w-full h-full"
          />
        ) : (
          <span className="text-primary font-bold text-lg select-none">
            {initials}
          </span>
        )}
      </div>

      <p className="text-foreground font-semibold text-sm text-center line-clamp-2 leading-tight w-full">
        {club.name}
      </p>

      {typeStyle && club.type && (
        <span
          className={cn(
            "mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0",
            typeStyle
          )}
        >
          {club.type}
        </span>
      )}

      {(flag ?? club.country) && (
        <div className="mt-auto pt-1 text-sm text-foreground-muted">
          {flag ?? club.country}
        </div>
      )}
    </div>
  );
}
