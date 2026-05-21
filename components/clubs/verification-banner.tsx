"use client";

import { useTranslations } from "next-intl";
import { AlertCircle, Clock } from "lucide-react";
import { Club } from "@/types/models/club";

interface VerificationBannerProps {
  club: Club;
  onVerifyClick: () => void;
}

export function VerificationBanner({
  club,
  onVerifyClick,
}: VerificationBannerProps) {
  const t = useTranslations("clubs.verification");

  const status = club.verificationStatus || "UNVERIFIED";

  if (status === "VERIFIED") {
    return null;
  }

  const isPending = status === "PENDING";

  return (
    <div
      className={`mb-6 p-4 rounded-lg border flex items-start justify-between gap-4 ${
        isPending
          ? "bg-yellow-500/10 border-yellow-500/30"
          : "bg-destructive/10 border-destructive/30"
      }`}
    >
      <div className="flex items-start gap-3 flex-1">
        {isPending ? (
          <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-1" />
        ) : (
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-1" />
        )}
        <div>
          <p
            className={`font-semibold ${
              isPending ? "text-yellow-900" : "text-destructive"
            }`}
          >
            {isPending ? t("pendingTitle") : t("unverifiedTitle")}
          </p>
          <p
            className={`text-sm mt-1 ${
              isPending ? "text-yellow-800" : "text-destructive/80"
            }`}
          >
            {isPending ? t("pendingDescription") : t("unverifiedDescription")}
          </p>
        </div>
      </div>

      {!isPending && (
        <button
          onClick={onVerifyClick}
          className="flex-shrink-0 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition text-sm font-medium whitespace-nowrap"
        >
          {t("verifyButton")}
        </button>
      )}
    </div>
  );
}
