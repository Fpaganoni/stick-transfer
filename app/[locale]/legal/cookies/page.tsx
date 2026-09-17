import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPageContent } from "@/components/legal/legal-page-content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  return { title: `${t("cookies.title")} | Stick Transfer` };
}

export default async function CookiePolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <LegalPageContent locale={locale} namespace="cookies" />;
}
