"use client";

import type { ReactNode } from "react";
import { useCountryNames } from "@/hooks/useCountryNames";
import { getCountryFlag } from "@/lib/countries";

interface CountryLabelProps {
  /** ISO code (any case); legacy free text is shown as it is. */
  value?: string | null;
  /** Shown before the country: "🇪🇸 Madrid, Spain". */
  city?: string | null;
  /** false: flag only (name kept as aria-label); text when there is no flag. */
  showName?: boolean;
  /** Rendered when there is neither city nor country. */
  fallback?: ReactNode;
  className?: string;
}

/** Flag + translated country name, optionally prefixed by the city. */
export function CountryLabel({
  value,
  city,
  showName = true,
  fallback = null,
  className,
}: CountryLabelProps) {
  const { nameOf } = useCountryNames();
  const name = nameOf(value);
  const flag = getCountryFlag(value);

  if (!showName && flag) {
    return (
      <span role="img" aria-label={name} title={name} className={className}>
        {flag}
      </span>
    );
  }

  const text = [city?.trim(), name].filter(Boolean).join(", ");
  if (!text) return <>{fallback}</>;

  return (
    <span className={className}>
      {flag && <span aria-hidden="true">{flag} </span>}
      {text}
    </span>
  );
}
