"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import type { Control, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUpdateUser, useUploadCv, useDeleteCv } from "@/hooks/useUsers";
import { TrajectoryItem } from "@/types/models/user";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Form,
  toBase64,
  BasicInfoSection,
  LocationSection,
  FormActions,
} from "./shared-sections";
import { CvUploadSection } from "./cv-upload-section";
import { TrajectoryFieldArray } from "./trajectory-field-array";
import { MultimediaFieldArray } from "./multimedia-field-array";
import {
  UmpireDetailsSection,
  UmpireCertificationsSection,
} from "./umpire-details-section";
import {
  createUmpireProfileSchema,
  buildUmpireUpdateFields,
  licenseFieldsChanged,
  parseLanguages,
  toDateInputValue,
  type UmpireProfileFormValues,
} from "./umpire-profile-schema";
import { formatTrajectories } from "./profile-form-utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Profile edit form for UMPIRE accounts: licence data, certifications,
 * CV, trajectories and multimedia. Position/club fields do not apply.
 */
export function UmpireProfileForm() {
  const router = useRouter();
  const t = useTranslations("profile");
  const tUmpire = useTranslations("umpire");
  const tCommon = useTranslations("common");
  const { user, updateUser } = useAuthStore();
  const { mutateAsync: updateProfile } = useUpdateUser();
  const uploadCv = useUploadCv();
  const removeCv = useDeleteCv();
  const inputRef = useRef<HTMLInputElement>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvDeleted, setCvDeleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingValues, setPendingValues] =
    useState<UmpireProfileFormValues | null>(null);

  const form = useForm<UmpireProfileFormValues>({
    resolver: zodResolver(createUmpireProfileSchema(t)),
    defaultValues: {
      name: user?.name || "",
      username: user?.username || "",
      avatar: user?.avatar || "",
      coverImage: user?.coverImage || "",
      bio: user?.bio || "",
      country: user?.country || "",
      city: user?.city || "",
      yearsOfExperience: user?.yearsOfExperience?.toString() ?? "",
      certificationYear: user?.certificationYear?.toString() ?? "",
      matchesOfficiated: user?.matchesOfficiated?.toString() ?? "",
      licenseLevel: user?.licenseLevel ?? "",
      certifyingBody: user?.certifyingBody ?? "",
      licenseNumber: user?.licenseNumber ?? "",
      travelAvailability: user?.travelAvailability ?? "",
      languages: (user?.languages ?? []).join(", "),
      modalities: user?.modalities ?? [],
      umpireCategories: user?.umpireCategories ?? [],
      umpireCertifications:
        user?.umpireCertifications?.map((c) => ({
          id: c.id,
          name: c.name,
          issuer: c.issuer,
          issuedAt: toDateInputValue(c.issuedAt),
          fileUrl: c.fileUrl ?? "",
        })) ?? [],
      trajectories:
        user?.trajectories?.map((tr) => ({
          id: tr.id || "",
          title: tr.title || "",
          organization: tr.organization || "",
          period: tr.period || "",
          description: tr.description || "",
          startDate: tr.startDate || "",
          endDate: tr.endDate || "",
          isCurrent: tr.isCurrent || false,
        })) || [],
      multimedia: user?.multimedia?.map((m) => ({ url: m })) || [],
    },
  });

  async function save(data: UmpireProfileFormValues) {
    if (!user) return;

    setIsSaving(true);
    try {
      const multimediaUrls = data.multimedia?.map((m) => m.url) || [];

      let finalCvUrl = user.cvUrl;

      if (cvDeleted && !cvFile) {
        await removeCv.mutateAsync({ userId: user.id });
        finalCvUrl = undefined;
      } else if (cvFile) {
        const base64 = await toBase64(cvFile);
        const res = await uploadCv.mutateAsync({ userId: user.id, base64 });
        if (res.uploadCV) {
          finalCvUrl = res.uploadCV;
        }
      }

      const umpireFields = buildUmpireUpdateFields(data, user);

      const response = await updateProfile({
        id: user.id,
        name: data.name,
        username: data.username,
        bio: data.bio,
        avatar: data.avatar,
        coverImage: data.coverImage,
        country: data.country,
        city: data.city,
        cvUrl: finalCvUrl,
        multimedia: multimediaUrls,
        trajectories: formatTrajectories(data.trajectories),
        ...umpireFields,
      });

      const saved = response?.updateUser;

      updateUser({
        name: data.name,
        username: data.username,
        avatar: data.avatar,
        coverImage: data.coverImage,
        bio: data.bio,
        country: data.country,
        city: data.city,
        cvUrl: finalCvUrl,
        trajectories: data.trajectories as TrajectoryItem[],
        multimedia: multimediaUrls,
        yearsOfExperience: umpireFields.yearsOfExperience ?? user.yearsOfExperience,
        certificationYear: umpireFields.certificationYear ?? user.certificationYear,
        matchesOfficiated: umpireFields.matchesOfficiated ?? user.matchesOfficiated,
        travelAvailability: umpireFields.travelAvailability ?? user.travelAvailability,
        licenseLevel: umpireFields.licenseLevel ?? user.licenseLevel,
        certifyingBody: umpireFields.certifyingBody ?? user.certifyingBody,
        licenseNumber: umpireFields.licenseNumber ?? user.licenseNumber,
        languages: parseLanguages(data.languages),
        modalities: data.modalities,
        umpireCategories: data.umpireCategories,
        umpireCertifications: saved?.umpireCertifications ?? umpireFields.umpireCertifications,
        // The backend un-verifies the umpire when licence data changes
        isVerified: saved?.isVerified ?? user.isVerified,
      });

      toast.success(t("editSuccess") || "Profile updated successfully!");
      router.push("/profile");
    } catch (error) {
      console.error("Error updating profile via GraphQL:", error);
      toast.error(
        t("editError") || "Failed to update profile. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function onSubmit(data: UmpireProfileFormValues) {
    if (user?.isVerified && licenseFieldsChanged(data, user)) {
      setPendingValues(data);
      return;
    }
    return save(data);
  }

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <BasicInfoSection control={form.control} t={t} />

        <UmpireDetailsSection control={form.control} t={t} tUmpire={tUmpire} />

        <UmpireCertificationsSection control={form.control} t={t} />

        <LocationSection control={form.control} t={t} />

        <CvUploadSection
          t={t}
          cvUrl={user.cvUrl}
          cvFile={cvFile}
          cvDeleted={cvDeleted}
          inputRef={inputRef}
          onFileChange={(file) => {
            setCvFile(file);
            if (file) setCvDeleted(false);
          }}
          onDeleteExisting={() => setCvDeleted(true)}
        />

        <Card className="bg-background">
          <CardHeader>
            <CardTitle>{t("editForm.trajectories")}</CardTitle>
            <CardDescription>{t("editForm.trajectoriesDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <TrajectoryFieldArray
              control={form.control as unknown as Control<FieldValues>}
              t={t}
            />
          </CardContent>
        </Card>

        <Card className="bg-background">
          <CardHeader>
            <CardTitle>{t("editForm.multimedia")}</CardTitle>
            <CardDescription>{t("editForm.multimediaDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <MultimediaFieldArray
              control={form.control as unknown as Control<FieldValues>}
              t={t}
            />
          </CardContent>
        </Card>

        <FormActions
          tCommon={tCommon}
          saveLabel={isSaving ? t("editForm.saving") : t("editForm.saveChanges")}
          isSaving={isSaving}
          onCancel={() => router.push("/profile")}
        />
      </form>

      <AlertDialog
        open={pendingValues !== null}
        onOpenChange={(open) => {
          if (!open) setPendingValues(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("editForm.umpire.verificationWarning.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("editForm.umpire.verificationWarning.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("editForm.umpire.verificationWarning.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const values = pendingValues;
                setPendingValues(null);
                if (values) void save(values);
              }}
            >
              {t("editForm.umpire.verificationWarning.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  );
}
