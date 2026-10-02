"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { FileText } from "lucide-react";
import type { User } from "@/types/models/user";
import { toDateInputValue } from "@/components/profile/edit/umpire-profile-schema";

export type UmpireInfo = Pick<
  User,
  | "licenseLevel"
  | "certifyingBody"
  | "licenseNumber"
  | "certificationYear"
  | "matchesOfficiated"
  | "yearsOfExperience"
  | "travelAvailability"
  | "languages"
  | "modalities"
  | "umpireCategories"
  | "umpireCertifications"
>;

interface UmpireInfoSectionProps {
  info: Partial<UmpireInfo>;
  isOwnProfile?: boolean;
}

const isPresent = (value: unknown) => value !== null && value !== undefined && value !== "";

/** Licence, experience and availability of an umpire, shown in the profile's officiating tab. */
export function UmpireInfoSection({
  info,
  isOwnProfile = false,
}: UmpireInfoSectionProps) {
  const t = useTranslations("profile");
  const tUmpire = useTranslations("umpire");

  const rows: { label: string; value: string | number }[] = [];
  const addRow = (label: string, value: string | number | null | undefined) => {
    if (isPresent(value)) rows.push({ label, value: value as string | number });
  };

  addRow(
    t("umpire.licenseLevel"),
    info.licenseLevel ? tUmpire(`licenseLevels.${info.licenseLevel}`) : null,
  );
  addRow(t("umpire.certifyingBody"), info.certifyingBody);
  // The backend only returns this to the owner and admins; null for everyone else
  addRow(t("umpire.licenseNumber"), info.licenseNumber);
  addRow(t("umpire.certificationYear"), info.certificationYear);
  addRow(t("umpire.matchesOfficiated"), info.matchesOfficiated);
  addRow(t("umpire.yearsOfExperience"), info.yearsOfExperience);
  addRow(
    t("umpire.travelAvailability"),
    info.travelAvailability ? tUmpire(`travelAvailability.${info.travelAvailability}`) : null,
  );

  const chipGroups = [
    { label: t("umpire.languages"), items: info.languages ?? [] },
    {
      label: t("umpire.modalities"),
      items: (info.modalities ?? []).map((m) => tUmpire(`modalities.${m}`)),
    },
    {
      label: t("umpire.categories"),
      items: (info.umpireCategories ?? []).map((c) => tUmpire(`categories.${c}`)),
    },
  ].filter((group) => group.items.length > 0);

  const certifications = [...(info.umpireCertifications ?? [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );

  const isEmpty =
    rows.length === 0 && chipGroups.length === 0 && certifications.length === 0;

  if (isEmpty) {
    return (
      <div className="py-8 text-center border-2 border-dashed border-foreground dark:border-border rounded-xl space-y-3">
        <p className="text-foreground dark:text-foreground-muted font-medium">
          {isOwnProfile ? t("umpire.noInfoOwn") : t("umpire.noInfo")}
        </p>
        {isOwnProfile && (
          <Link
            href="/profile/edit"
            className="inline-block text-primary font-semibold hover:underline"
          >
            {t("umpire.completeProfile")}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {rows.length > 0 && (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rows.map((row) => (
            <div
              key={row.label}
              className="bg-background rounded-xl border border-border px-5 py-3"
            >
              <dt className="text-xs uppercase tracking-wide text-foreground-muted">
                {row.label}
              </dt>
              <dd className="text-foreground font-semibold mt-1">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {chipGroups.map((group) => (
        <div key={group.label} className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">{group.label}</h3>
          <ul className="flex flex-wrap gap-2">
            {group.items.map((item) => (
              <li
                key={item}
                className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-sm text-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {certifications.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">
            {t("umpire.certifications")}
          </h3>
          <ul className="space-y-3">
            {certifications.map((cert) => {
              const issuedAt = toDateInputValue(cert.issuedAt);
              return (
                <li
                  key={cert.id ?? `${cert.name}-${cert.issuer}`}
                  className="bg-background rounded-xl border border-border px-5 py-3 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{cert.name}</p>
                    <p className="text-sm text-foreground-muted">{cert.issuer}</p>
                    {issuedAt && (
                      <p className="text-xs text-foreground-muted mt-1">{issuedAt}</p>
                    )}
                  </div>
                  {cert.fileUrl && (
                    <a
                      href={cert.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-primary hover:underline flex items-center gap-1 text-sm"
                    >
                      <FileText size={16} />
                      {t("umpire.viewDocument")}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
