"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { CalendarDays, Gift, Trophy, type LucideIcon } from "lucide-react";
import { ClubContactSection } from "@/components/clubs/club-contact-section";
import type { Club } from "@/types/models/club";

interface FactProps {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}

function Fact({ icon: Icon, label, children }: FactProps) {
  return (
    <div className="flex items-start gap-3">
      <Icon aria-hidden className="w-5 h-5 text-primary shrink-0 mt-1" />
      <div className="min-w-0">
        <p className="text-foreground-muted text-sm font-medium">{label}</p>
        <div className="text-foreground text-sm">{children}</div>
      </div>
    </div>
  );
}

/** The Profile tab: description, league, foundation, benefits, contact and socials. */
export function ClubProfileDetails({ club }: { club: Club }) {
  const t = useTranslations("clubProfile");
  const benefits = club.benefits ?? [];

  return (
    <div className="max-w-3xl">
      <section className="bg-background rounded-xl p-6 border border-border space-y-5">
        <div>
          <h2 className="font-bold text-foreground text-lg mb-2">{t("profile.description")}</h2>
          <p className="text-foreground/80 text-sm leading-relaxed whitespace-pre-line">
            {club.description || t("noBio")}
          </p>
        </div>

        {(club.league || club.foundedYear) && (
          <div className="grid sm:grid-cols-2 gap-4 border-t border-border pt-5">
            {club.league && (
              <Fact icon={Trophy} label={t("profile.league")}>
                {club.league}
              </Fact>
            )}
            {club.foundedYear && (
              <Fact icon={CalendarDays} label={t("profile.founded")}>
                {club.foundedYear}
              </Fact>
            )}
          </div>
        )}

        {benefits.length > 0 && (
          <div className="border-t border-border pt-5">
            <Fact icon={Gift} label={t("profile.benefits")}>
              <ul className="mt-1 flex flex-wrap gap-2">
                {benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="px-3 py-1 rounded-full bg-primary/10 text-foreground text-sm"
                  >
                    {benefit}
                  </li>
                ))}
              </ul>
            </Fact>
          </div>
        )}
      </section>

      <ClubContactSection club={club} />
    </div>
  );
}
