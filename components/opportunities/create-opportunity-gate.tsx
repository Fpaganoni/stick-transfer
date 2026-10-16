"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ShieldAlert } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateOpportunityForm } from "@/components/opportunities/create-opportunity-form";
import { useClub } from "@/hooks/useClubs";
import { canPublishVacancies } from "@/lib/club-publishing";
import { useAuthStore } from "@/stores/useAuthStore";

/**
 * The "post a job" form, but only for a verified club. A club that is not verified is
 * told why, and sent to its profile, where the verification document is uploaded,
 * before it fills in a form the backend would refuse (CLUB_NOT_VERIFIED).
 */
export function CreateOpportunityGate() {
  const t = useTranslations("opportunities");
  const user = useAuthStore((state) => state.user);
  // A CLUB account is the club itself: its club id is the account id
  const { data, isLoading, isError } = useClub(user?.id ?? null);
  const status = data?.club?.verificationStatus;

  if (isError) {
    return (
      <p role="alert" className="text-sm text-error">
        {t("create.gate.loadError")}
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (canPublishVacancies(status)) return <CreateOpportunityForm />;

  const isPending = status === "PENDING";

  return (
    <Card className="bg-background">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert aria-hidden className="size-5 text-primary" />
          {t("create.gate.title")}
        </CardTitle>
        <CardDescription>
          {isPending ? t("create.gate.pendingDescription") : t("create.gate.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href="/profile">{t("create.gate.goToProfile")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
