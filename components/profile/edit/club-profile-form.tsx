"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import type { Club } from "@/types/models/club";
import { ClubOnboardingNotice } from "@/components/clubs/club-onboarding-notice";
import { useAuthStore } from "@/stores/useAuthStore";
import { useClub, useUpdateClub } from "@/hooks/useClubs";
import { LocationSection, FormActions } from "./shared-sections";
import { ClubContactFields } from "./club-contact-fields";
import {
  ClubDetailsCard,
  ClubIdentityCard,
  ClubResponsibleCard,
} from "./club-form-sections";
import {
  createClubFormSchema,
  getClubFormValues,
  mapClubSaveError,
  toUpdateClubVariables,
  type ClubFormValues,
} from "./club-form-model";

/**
 * The one edit form of a CLUB account. The account is the club, so there is no
 * second "personal" profile: identity, club data, contact and the private person
 * in charge are saved together with a single updateClub call. Fields of a
 * person (birth date, CV, position, trajectories, multimedia) are never sent.
 */
export function ClubProfileForm() {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const { user } = useAuthStore();
  // A CLUB account is the club itself: its club id is the account id
  const { data: clubData, isError, refetch } = useClub(user?.id ?? null);
  const club = clubData?.club;

  // The form is only mounted once the club is here: an empty form that fills in
  // later would let the owner type over data that is about to arrive
  if (club) return <ClubProfileFormBody club={club} />;

  if (isError) {
    return (
      <div role="alert" className="space-y-3 text-sm text-error">
        <p>{t("editForm.club.loadError")}</p>
        <Button type="button" variant="outline" onClick={() => refetch()}>
          {t("editForm.club.retry")}
        </Button>
      </div>
    );
  }

  return <div>{tCommon("loading")}</div>;
}

function ClubProfileFormBody({ club }: { club: Club }) {
  const router = useRouter();
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const { updateUser } = useAuthStore();
  const { mutateAsync: updateClub } = useUpdateClub();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ClubFormValues>({
    resolver: zodResolver(createClubFormSchema(t)),
    values: getClubFormValues(club),
    // A background refetch brings in untouched fields without wiping what is being typed
    resetOptions: { keepDirtyValues: true },
  });

  async function onSubmit(data: ClubFormValues) {
    setIsSaving(true);
    try {
      const { updateClub: saved } = await updateClub(toUpdateClubVariables(club.id, data));

      // The session shows the account: keep it in step with what was saved
      updateUser({
        name: saved.name ?? data.name,
        username: saved.user?.username ?? data.username,
        avatar: saved.logo ?? "",
        coverImage: saved.coverImage ?? "",
        bio: data.bio,
        country: data.country,
        city: data.city,
      });

      toast.success(t("editSuccess"));
      router.push("/profile");
    } catch (error) {
      const { fields, showToast } = mapClubSaveError(error);
      fields.forEach(({ name, messageKey }) =>
        form.setError(name, {
          type: "server",
          message: t(`editForm.club.serverErrors.${messageKey}`),
        }),
      );
      if (fields[0]) form.setFocus(fields[0].name);
      if (showToast) toast.error(t("editError"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* The saved club: the reminder goes away once the crest and the description are stored */}
        <ClubOnboardingNotice club={club} showAction={false} />

        <ClubIdentityCard
          control={form.control}
          t={t}
          verificationStatus={club?.verificationStatus}
        />
        <LocationSection control={form.control} t={t} />
        <ClubDetailsCard control={form.control} t={t} />
        <ClubContactFields control={form.control} t={t} />
        <ClubResponsibleCard control={form.control} t={t} />

        <FormActions
          tCommon={tCommon}
          saveLabel={isSaving ? t("editForm.saving") : t("editForm.saveChanges")}
          isSaving={isSaving}
          onCancel={() => router.push("/profile")}
        />
      </form>
    </Form>
  );
}
