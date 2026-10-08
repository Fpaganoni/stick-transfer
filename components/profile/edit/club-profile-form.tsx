"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUpdateUser } from "@/hooks/useUsers";
import { useClub, useUpdateClub } from "@/hooks/useClubs";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import {
  BasicInfoSection,
  LocationSection,
  FormActions,
  ImageUploadField,
} from "./shared-sections";

const createClubFormSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(2, { message: t("editForm.validation.nameMin") }),
    username: z
      .string()
      .regex(/^[a-zA-Z0-9_]{3,20}$/, {
        message: t("editForm.validation.usernameMin"),
      }),
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
    country: z.string().optional(),
    city: z.string().optional(),
    clubName: z
      .string()
      .min(2, { message: t("editForm.club.validation.nameMin") }),
    clubDescription: z.string().optional(),
    clubLogo: z
      .string()
      .url({ message: t("editForm.validation.urlInvalid") })
      .optional()
      .or(z.literal("")),
    managedByFirstName: z
      .string()
      .min(1, { message: t("editForm.club.validation.managedByFirstNameRequired") }),
    managedByLastName: z
      .string()
      .min(1, { message: t("editForm.club.validation.managedByLastNameRequired") }),
  });

type ClubFormValues = z.infer<ReturnType<typeof createClubFormSchema>>;

function VerificationBadge({
  status,
  t,
}: {
  status?: string;
  t: (key: string) => string;
}) {
  const normalized = (status || "UNVERIFIED").toUpperCase();

  if (normalized === "VERIFIED") {
    return (
      <Badge className="bg-success/30 text-foreground border-success/40 gap-1">
        <CheckCircle size={14} />
        {t("editForm.club.title")}
      </Badge>
    );
  }
  if (normalized === "PENDING") {
    return (
      <Badge className="bg-info/30 text-foreground border-info/40 gap-1">
        <Clock size={14} />
        {normalized}
      </Badge>
    );
  }
  if (normalized === "REJECTED") {
    return (
      <Badge className="bg-error/30 text-foreground border-error/40 gap-1">
        <XCircle size={14} />
        {normalized}
      </Badge>
    );
  }
  return (
    <Badge className="bg-foreground/10 text-foreground-muted border-border gap-1">
      {normalized}
    </Badge>
  );
}

/** Profile edit form for CLUB accounts: personal account fields + club entity fields. No CV/trajectories/multimedia. */
export function ClubProfileForm() {
  const router = useRouter();
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const { user, updateUser } = useAuthStore();
  const { mutateAsync: updateProfile } = useUpdateUser();
  const { mutateAsync: updateClub } = useUpdateClub();
  const { data: clubData } = useClub(user?.clubId ?? null);
  const [isSaving, setIsSaving] = useState(false);

  const club = clubData?.club;
  const clubFormSchema = createClubFormSchema(t);

  const form = useForm<ClubFormValues>({
    resolver: zodResolver(clubFormSchema),
    values: {
      name: user?.name || "",
      username: user?.username || "",
      avatar: user?.avatar || "",
      coverImage: user?.coverImage || "",
      bio: user?.bio || "",
      country: user?.country || "",
      city: user?.city || "",
      clubName: club?.name || "",
      clubDescription: club?.description || "",
      clubLogo: club?.logo || "",
      managedByFirstName: club?.managedBy?.firstName || "",
      managedByLastName: club?.managedBy?.lastName || "",
    },
  });

  async function onSubmit(data: ClubFormValues) {
    if (!user) return;

    setIsSaving(true);
    try {
      await updateProfile({
        id: user.id,
        name: data.name,
        username: data.username,
        bio: data.bio,
        avatar: data.avatar,
        coverImage: data.coverImage,
        country: data.country,
        city: data.city,
      });

      if (club?.id) {
        await updateClub({
          id: club.id,
          name: data.clubName,
          description: data.clubDescription,
          city: data.city,
          country: data.country,
          logo: data.clubLogo,
          managedByFirstName: data.managedByFirstName,
          managedByLastName: data.managedByLastName,
        });
      }

      updateUser({
        name: data.name,
        username: data.username,
        avatar: data.avatar,
        coverImage: data.coverImage,
        bio: data.bio,
        country: data.country,
        city: data.city,
      });

      toast.success(t("editSuccess") || "Profile updated successfully!");
      router.push("/profile");
    } catch (error) {
      console.error("Error updating club profile via GraphQL:", error);
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
        <LocationSection control={form.control} t={t} />

        <Card className="bg-background">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>{t("editForm.club.title")}</CardTitle>
              <CardDescription>{t("editForm.club.desc")}</CardDescription>
            </div>
            <VerificationBadge status={club?.verificationStatus} t={t} />
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="clubName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("editForm.club.name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("editForm.club.placeholders.name")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clubDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("editForm.club.description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      className="resize-none"
                      placeholder={t("editForm.club.placeholders.description")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clubLogo"
              render={({ field }) => (
                <ImageUploadField
                  label={t("editForm.club.logoUrl")}
                  value={field.value || ""}
                  onChange={field.onChange}
                />
              )}
            />
          </CardContent>
        </Card>

        <Card className="bg-background">
          <CardHeader>
            <CardTitle>{t("editForm.club.managedByTitle")}</CardTitle>
            <CardDescription>{t("editForm.club.managedByDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="managedByFirstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("editForm.club.managedByFirstName")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("editForm.club.placeholders.managedByFirstName")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="managedByLastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("editForm.club.managedByLastName")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("editForm.club.placeholders.managedByLastName")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
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
    </Form>
  );
}
