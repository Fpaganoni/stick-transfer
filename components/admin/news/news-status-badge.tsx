"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";

interface NewsStatusBadgeProps {
  isPublished: boolean;
}

export function NewsStatusBadge({ isPublished }: NewsStatusBadgeProps) {
  const t = useTranslations("admin.news");

  return (
    <Badge
      variant="outline"
      className={isPublished ? "border-success text-success" : "border-foreground-muted text-foreground-muted"}
    >
      {isPublished ? t("status.published") : t("status.draft")}
    </Badge>
  );
}
