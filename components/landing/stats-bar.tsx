"use client";

import { useTranslations } from "next-intl";

const STATS = ["players", "clubs", "countries", "vacancies"];

export function StatsBar() {
  const t = useTranslations("landing.statsBar");

  return (
    <div className="bg-background border-b border-border">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border">
          {STATS.map((key) => (
            <div key={key} className="text-center px-6 py-5">
              <p className="text-2xl md:text-3xl font-extrabold text-primary">
                {t(`${key}.value` as Parameters<typeof t>[0])}
              </p>
              <p className="text-xs text-foreground-muted mt-1 font-semibold uppercase tracking-widest">
                {t(`${key}.label` as Parameters<typeof t>[0])}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
