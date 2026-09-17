import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { HockeyXTicks } from "@/components/ui/hockey-xtick";
import { Card, CardContent } from "@/components/ui/card";

type LegalSection = {
  heading: string;
  body: string;
};

export async function LegalPageContent({
  locale,
  namespace,
}: {
  locale: string;
  namespace: "privacy" | "terms" | "cookies";
}) {
  const t = await getTranslations({ locale, namespace: "legal" });
  const title = t(`${namespace}.title`);
  const intro = t(`${namespace}.intro`);
  const sections = t.raw(`${namespace}.sections`) as LegalSection[];
  const lastUpdated = t("lastUpdated", { date: "September 17, 2026" });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="size-4" />
          {t("backToHome")}
        </Link>

        <div className="flex items-center gap-2 mb-2">
          <HockeyXTicks size={28} className="text-primary" />
          <span className="text-sm font-semibold text-foreground-muted">
            Stick Transfer
          </span>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-sm text-foreground-muted mb-8">{lastUpdated}</p>

        <Card>
          <CardContent className="prose prose-sm max-w-none pt-6 space-y-6">
            <p className="text-foreground-muted">{intro}</p>

            {sections.map((section) => (
              <div key={section.heading}>
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  {section.heading}
                </h2>
                <p className="text-foreground-muted leading-relaxed">
                  {section.body}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
