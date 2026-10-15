"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Briefcase, MessageCircle, Star, Users } from "lucide-react";

const VISITOR_ITEMS = [
  { icon: Users, key: "visitor.item1" },
  { icon: Briefcase, key: "visitor.item2" },
  { icon: MessageCircle, key: "visitor.item3" },
  { icon: Star, key: "visitor.item4" },
] as const;

/** Invitation to join, shown to a visitor without a session. */
export function ClubVisitorPrompt({ clubName }: { clubName: string }) {
  const t = useTranslations("clubProfile");

  return (
    <div className="my-4 bg-surface border border-border rounded-xl p-6 text-center">
      <h2 className="text-foreground font-bold text-lg mb-1">
        {t("visitor.title", { name: clubName })}
      </h2>
      <p className="text-foreground-muted text-sm mb-4">{t("visitor.subtitle")}</p>
      <ul className="space-y-2 mb-5 text-left max-w-xs mx-auto">
        {VISITOR_ITEMS.map(({ icon: Icon, key }) => (
          <li key={key} className="flex items-center gap-2 text-foreground text-sm">
            <Icon aria-hidden size={16} className="text-primary shrink-0" />
            {t(key)}
          </li>
        ))}
      </ul>
      <div className="flex gap-3 justify-center flex-wrap">
        <Link
          href="/register"
          className="px-5 py-2 bg-primary text-white-black font-semibold rounded-lg hover:bg-primary-hover transition-colors text-sm"
        >
          {t("visitor.createAccount")}
        </Link>
        <Link
          href="/login"
          className="px-5 py-2 border border-border text-foreground rounded-lg hover:bg-surface-elevated transition-colors text-sm"
        >
          {t("visitor.logIn")}
        </Link>
      </div>
    </div>
  );
}
