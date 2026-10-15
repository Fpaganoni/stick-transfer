"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import {
  getClubProfileCompleteness,
  type ClubProfileMissingField,
} from "@/lib/club-profile-completeness";

interface ClubOnboardingNoticeProps {
  /** The saved club: the notice goes away once the crest and the description are stored. */
  club: { logo?: string | null; description?: string | null } | null | undefined;
  /** Hidden inside the editor, where the link would point to the page the owner is on. */
  showAction?: boolean;
}

/**
 * "Complete your club profile": shown to the owner of a new club until the
 * crest and the description are saved.
 */
export function ClubOnboardingNotice({ club, showAction = true }: ClubOnboardingNoticeProps) {
  const t = useTranslations("clubProfile.onboarding");
  const { isComplete, missing } = getClubProfileCompleteness(club);

  if (isComplete) return null;

  return (
    <div
      role="status"
      className="mb-6 p-4 rounded-lg border border-primary/30 bg-primary/10 flex flex-col sm:flex-row sm:items-center gap-4"
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <Sparkles aria-hidden className="w-5 h-5 text-primary shrink-0 mt-1" />
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{t("title")}</p>
          <p className="text-sm text-foreground-muted mt-1">{t("description")}</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-foreground">
            {missing.map((field: ClubProfileMissingField) => (
              <li key={field}>{t(`missing.${field}`)}</li>
            ))}
          </ul>
        </div>
      </div>

      {showAction && (
        <Link
          href="/profile/edit"
          className="shrink-0 px-4 py-2 bg-primary text-white-black font-semibold rounded-lg hover:bg-primary-hover transition-colors text-sm text-center"
        >
          {t("action")}
        </Link>
      )}
    </div>
  );
}
