"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import type { Control, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUpdateUser, useUploadCv, useDeleteCv } from "@/hooks/useUsers";
import { TrajectoryItem } from "@/types/models/user";
import { Position } from "@/types/enums";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Form,
  toBase64,
  BasicInfoSection,
  PlayerDetailsSection,
  LocationSection,
  FormActions,
} from "./shared-sections";
import { CvUploadSection } from "./cv-upload-section";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrajectoryFieldArray } from "./trajectory-field-array";
import { MultimediaFieldArray } from "./multimedia-field-array";

// We'll move validation translations inside the component to use the hook
const createProfileFormSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(2, { message: t("editForm.validation.nameMin") }),
    username: z
      .string()
      .min(2, { message: t("editForm.validation.usernameMin") }),
    avatar: z
      .string()
      .url({ message: t("editForm.validation.urlInvalid") })
      .optional()
      .or(z.literal("")),
    coverImage: z
      .string()
      .url({ message: t("editForm.validation.urlInvalid") })
      .optional()
      .or(z.literal("")),
    bio: z
      .string()
      .max(500, { message: t("editForm.validation.bioMax") })
      .optional(),
    position: z.string().optional(),
    yearsOfExperience: z.coerce.number().min(0).optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    trajectories: z
      .array(
        z.object({
          id: z.string().optional(),
          title: z
            .string()
            .min(1, { message: t("editForm.validation.titleRequired") }),
          organization: z.string().optional(),
          period: z
            .string()
            .min(1, { message: t("editForm.validation.periodRequired") }),
          description: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          isCurrent: z.boolean().optional(),
        }),
      )
      .optional(),
    multimedia: z
      .array(
        z.object({
          url: z.string().url({ message: t("editForm.validation.urlInvalid") }),
        }),
      )
      .optional(),
  });

type ProfileFormValues = z.infer<ReturnType<typeof createProfileFormSchema>>;

/** Profile edit form for PLAYER and COACH accounts: position, CV, trajectories, multimedia. */
export function PlayerCoachProfileForm() {
  const router = useRouter();
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const { user, updateUser } = useAuthStore();
  const { mutateAsync: updateProfile } = useUpdateUser();
  const uploadCv = useUploadCv();
  const removeCv = useDeleteCv();
  const inputRef = useRef<HTMLInputElement>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvDeleted, setCvDeleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const profileFormSchema = createProfileFormSchema(t);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      username: user?.username || "",
      avatar: user?.avatar || "",
      coverImage: user?.coverImage || "",
      bio: user?.bio || "",
      position: user?.position || "",
      yearsOfExperience: user?.yearsOfExperience || 0,
      country: user?.country || "",
      city: user?.city || "",
      trajectories:
        user?.trajectories?.map((t) => ({
          id: t.id || "",
          title: t.title || "",
          organization: t.organization || "",
          period: t.period || "",
          description: t.description || "",
          startDate: t.startDate || "",
          endDate: t.endDate || "",
          isCurrent: t.isCurrent || false,
        })) || [],
      multimedia: user?.multimedia?.map((m) => ({ url: m })) || [],
    },
  });

  async function onSubmit(data: ProfileFormValues) {
    if (!user) return;

    setIsSaving(true);
    try {
      const multimediaUrls = data.multimedia?.map((m) => m.url) || [];
      const updatedTrajectories = data.trajectories?.map((t) => {
        let formattedStartDate = undefined;
        if (t.startDate && t.startDate.trim() !== "") {
          formattedStartDate = !isNaN(Number(t.startDate))
            ? new Date(Number(t.startDate)).toISOString()
            : t.startDate;
        }

        let formattedEndDate = undefined;
        if (t.endDate && t.endDate.trim() !== "") {
          formattedEndDate = !isNaN(Number(t.endDate))
            ? new Date(Number(t.endDate)).toISOString()
            : t.endDate;
        }

        return {
          id: t.id,
          title: t.title,
          organization: t.organization,
          period: t.period,
          description: t.description || "",
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          isCurrent: t.isCurrent,
        };
      });

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

      await updateProfile({
        id: user.id,
        name: data.name,
        username: data.username,
        bio: data.bio,
        avatar: data.avatar,
        coverImage: data.coverImage,
        position: data.position,
        country: data.country,
        city: data.city,
        cvUrl: finalCvUrl,
        yearsOfExperience: data.yearsOfExperience,
        multimedia: multimediaUrls,
        trajectories: updatedTrajectories,
      });

      updateUser({
        name: data.name,
        username: data.username,
        avatar: data.avatar,
        coverImage: data.coverImage,
        bio: data.bio,
        position: data.position as Position | undefined,
        yearsOfExperience: data.yearsOfExperience,
        country: data.country,
        city: data.city,
        cvUrl: finalCvUrl,
        trajectories: data.trajectories as TrajectoryItem[],
        multimedia: multimediaUrls,
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

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <BasicInfoSection control={form.control} t={t} />

        <Card className="bg-background">
          <CardHeader>
            <CardTitle>{t("editForm.playerDetails") || t("editForm.basicInfo")}</CardTitle>
            <CardDescription>{t("editForm.basicInfoDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <PlayerDetailsSection control={form.control} t={t} />
          </CardContent>
        </Card>

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
            <TrajectoryFieldArray control={form.control as unknown as Control<FieldValues>} t={t} />
          </CardContent>
        </Card>

        <Card className="bg-background">
          <CardHeader>
            <CardTitle>{t("editForm.multimedia")}</CardTitle>
            <CardDescription>{t("editForm.multimediaDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <MultimediaFieldArray control={form.control as unknown as Control<FieldValues>} t={t} />
          </CardContent>
        </Card>

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
