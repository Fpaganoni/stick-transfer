"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  UK_HOME_NATIONS,
  getCountryName,
  type HomeNationNames,
} from "@/lib/countries";

export interface CountryNames {
  locale: string;
  /** England/Scotland/Wales in the active language (from messages/*). */
  homeNationNames: HomeNationNames;
  /** Translated name of a code; legacy free text comes back as it is. */
  nameOf: (value?: string | null) => string;
}

export function useCountryNames(): CountryNames {
  const locale = useLocale();
  const t = useTranslations("countries.names");

  return useMemo(() => {
    const homeNationNames: HomeNationNames = Object.fromEntries(
      UK_HOME_NATIONS.map((code) => [code, t(code)]),
    );
    return {
      locale,
      homeNationNames,
      nameOf: (value) => getCountryName(value, locale, homeNationNames),
    };
  }, [locale, t]);
}
