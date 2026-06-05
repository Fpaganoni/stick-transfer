"use client";

import { useState } from "react";
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
import { useRef } from "react";
import { Upload, Trash2, FileText } from "lucide-react";
import { motion } from "framer-motion";

async function toBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { TrajectoryFieldArray } from "./trajectory-field-array";
import { MultimediaFieldArray } from "./multimedia-field-array";
import { toast } from "sonner";

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

export function EditProfileForm() {
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

  // Initialize form
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

      // Make the API call via React Query hook
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

      // We update the local state to see changes immediately
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
        {/* Basic Information */}
        <Card className="bg-background">
          <CardHeader>
            <CardTitle>{t("editForm.basicInfo")}</CardTitle>
            <CardDescription>{t("editForm.basicInfoDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("editForm.name")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("editForm.placeholders.name")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("editForm.username")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("editForm.placeholders.username")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("editForm.position")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("editForm.placeholders.position")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="yearsOfExperience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("editForm.yearsOfExperience")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={t(
                          "editForm.placeholders.yearsOfExperience",
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("editForm.bio")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("editForm.placeholders.bio")}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="avatar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("editForm.avatarUrl")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("editForm.placeholders.avatarUrl")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="coverImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("editForm.coverImageUrl") || "Cover Image URL"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        t("editForm.placeholders.coverImageUrl") ||
                        "https://example.com/cover.jpg"
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card className="bg-background">
          <CardHeader>
            <CardTitle>{t("editForm.location")}</CardTitle>
            <CardDescription>{t("editForm.locationDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("editForm.countryCode")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("editForm.placeholders.countryCode")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("editForm.city")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("editForm.placeholders.city")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* CV Upload */}
        <Card className="bg-background">
          <CardHeader>
            <CardTitle>
              {t("cv.label", { fallback: "Curriculum Vitae" })}
            </CardTitle>
            <CardDescription>
              {t("cv.upload", { fallback: "Upload your CV in PDF format" })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 border border-input rounded-md p-4 bg-muted/20">
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    if (f.size > 5 * 1024 * 1024) {
                      toast.error("File too large. Maximum 5MB.");
                      return;
                    }
                    if (f.type !== "application/pdf") {
                      toast.error("Invalid file format. Please upload a PDF.");
                      return;
                    }
                    setCvFile(f);
                    setCvDeleted(false);
                  }
                  e.target.value = "";
                }}
              />
              {cvFile ? (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">{cvFile.name}</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    className="border border-error py-2.5 px-3 rounded-md hover:bg-error/10 transition-colors"
                    onClick={() => setCvFile(null)}
                  >
                    <Trash2 className="w-4 h-4 text-error " />
                  </motion.button>
                </div>
              ) : user.cvUrl && !cvDeleted ? (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <a
                      href={user.cvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:underline text-primary truncate max-w-[200px] md:max-w-xs block"
                    >
                      {t("cv.download", { fallback: "Download existing CV" })}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => inputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {t("cv.change", { fallback: "Change" })}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setCvDeleted(true)}
                    >
                      <Trash2 className="w-4 h-4 text-error hover:text-error/70 transition-colors" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed py-10"
                  onClick={() => inputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-1 text-foreground-muted hover:text-foreground">
                    <Upload className="w-6 h-6 mb-1 text-primary" />
                    <span className="font-semibold text-primary">
                      {t("cv.upload", { fallback: "Upload CV (PDF)" })}
                    </span>
                    <span className="text-xs">Max size: 5MB</span>
                  </div>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Trajectories Array */}
        <Card className="bg-background">
          <CardHeader>
            <CardTitle>{t("editForm.trajectories")}</CardTitle>
            <CardDescription>{t("editForm.trajectoriesDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <TrajectoryFieldArray control={form.control as unknown as Control<FieldValues>} t={t} />
          </CardContent>
        </Card>

        {/* Multimedia Array */}
        <Card className="bg-background">
          <CardHeader>
            <CardTitle>{t("editForm.multimedia")}</CardTitle>
            <CardDescription>{t("editForm.multimediaDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <MultimediaFieldArray control={form.control as unknown as Control<FieldValues>} t={t} />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 mt-8 pb-10">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/profile")}
            disabled={isSaving}
          >
            {tCommon("cancel")}
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? t("editForm.saving") : t("editForm.saveChanges")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
