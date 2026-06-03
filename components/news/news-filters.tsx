"use client";

import { useTranslations } from "next-intl";
import type { NewsCategory } from "@/hooks/useNews";

const CATEGORIES: Array<{ key: NewsCategory | "ALL"; label: string }> = [
  { key: "ALL", label: "all" },
  { key: "INTERNATIONAL", label: "international" },
  { key: "NATIONAL", label: "national" },
  { key: "TRANSFERS", label: "transfers" },
  { key: "EQUIPMENT", label: "equipment" },
  { key: "RESULTS", label: "results" },
];

interface NewsFiltersProps {
  active: NewsCategory | "ALL";
  onChange: (category: NewsCategory | "ALL") => void;
}

export function NewsFilters({ active, onChange }: NewsFiltersProps) {
  const t = useTranslations("news");

  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border border-border transition-colors ${
            active === key
              ? "bg-primary text-white-black border-primary"
              : "bg-surface text-foreground hover:bg-surface-elevated"
          }`}
        >
          {t(`categories.${label}`)}
        </button>
      ))}
    </div>
  );
}
