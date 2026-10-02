"use client";

import { useTranslations, useLocale } from "next-intl";
import { CalendarClock } from "lucide-react";
import type { JobOpportunity } from "@/types/models/job-opportunity";
import { formatMatchDate } from "@/lib/format-match-date";

type UmpireRequirements = Pick<
  JobOpportunity,
  "licenseLevelRequired" | "modality" | "umpireCategory" | "matchDate"
>;

interface UmpireJobDetailsProps {
  opportunity: UmpireRequirements;
  /** `chips` for list cards, `detail` (labelled grid) for the detail modal. */
  variant?: "chips" | "detail";
}

/** Licence, modality, category and match date an UMPIRE opportunity asks for. Renders nothing if none were set. */
export function UmpireJobDetails({
  opportunity,
  variant = "chips",
}: UmpireJobDetailsProps) {
  const t = useTranslations("opportunities");
  const tUmpire = useTranslations("umpire");
  const locale = useLocale();

  const matchDate = formatMatchDate(opportunity.matchDate, locale);

  const items = [
    opportunity.licenseLevelRequired && {
      key: "licenseLevel",
      label: t("umpireJob.licenseLevel"),
      value: tUmpire(`licenseLevels.${opportunity.licenseLevelRequired}`),
    },
    opportunity.modality && {
      key: "modality",
      label: t("umpireJob.modality"),
      value: tUmpire(`modalities.${opportunity.modality}`),
    },
    opportunity.umpireCategory && {
      key: "category",
      label: t("umpireJob.category"),
      value: tUmpire(`categories.${opportunity.umpireCategory}`),
    },
  ].filter((item): item is { key: string; label: string; value: string } => !!item);

  if (items.length === 0 && !matchDate) return null;

  if (variant === "detail") {
    return (
      <div data-testid="umpire-job-details">
        <h3 className="text-sm font-semibold text-foreground-muted uppercase tracking-wide mb-3">
          {t("umpireJob.title")}
        </h3>
        <dl className="grid grid-cols-2 gap-3">
          {items.map((item) => (
            <div key={item.key}>
              <dt className="text-xs text-foreground-muted uppercase tracking-wide">
                {item.label}
              </dt>
              <dd className="text-sm font-semibold text-foreground">{item.value}</dd>
            </div>
          ))}
          {matchDate && (
            <div>
              <dt className="text-xs text-foreground-muted uppercase tracking-wide">
                {t("umpireJob.matchDate")}
              </dt>
              <dd className="text-sm font-semibold text-foreground">{matchDate}</dd>
            </div>
          )}
        </dl>
      </div>
    );
  }

  return (
    <div
      data-testid="umpire-job-details"
      className="flex flex-wrap items-center gap-1.5 mt-2"
    >
      {items.map((item) => (
        <span
          key={item.key}
          className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs text-foreground"
        >
          {item.value}
        </span>
      ))}
      {matchDate && (
        <span
          data-testid="match-date"
          className="flex items-center gap-1 text-xs text-foreground-muted"
        >
          <CalendarClock size={12} />
          {matchDate}
        </span>
      )}
    </div>
  );
}
