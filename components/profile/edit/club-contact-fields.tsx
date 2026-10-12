"use client";

import type { Control } from "react-hook-form";
import * as z from "zod";
import {
  Globe,
  Mail,
  Phone,
  Instagram,
  Twitter,
  Facebook,
  Music,
  type LucideIcon,
} from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  SOCIAL_PLATFORMS,
  isValidEmail,
  normalizeSocialHandle,
  toWebsiteUrl,
  type SocialPlatform,
} from "@/lib/social-links";
import type { Club, UpdateClubVariables } from "@/types/models/club";
import type { ClubFormValues } from "./club-profile-form";

const PHONE_PATTERN = /^\+?[0-9 ()-]{6,20}$/;

type ContactField = "website" | "email" | "phone";
export type ClubContactFieldName = ContactField | SocialPlatform;
type ClubContactValues = Record<ClubContactFieldName, string>;

/** Empty is allowed: every contact field is optional and "" clears it. */
const optionalField = (isValid: (value: string) => boolean, message: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === "" || isValid(value), { message });

export function createClubContactShape(t: (key: string) => string) {
  const handleField = (platform: SocialPlatform) =>
    optionalField(
      (value) => normalizeSocialHandle(platform, value) !== null,
      t("editForm.club.contact.validation.handleInvalid"),
    );

  return {
    website: optionalField(
      (value) => toWebsiteUrl(value) !== null,
      t("editForm.club.contact.validation.websiteInvalid"),
    ),
    email: optionalField(
      isValidEmail,
      t("editForm.club.contact.validation.emailInvalid"),
    ),
    phone: optionalField(
      (value) => PHONE_PATTERN.test(value),
      t("editForm.club.contact.validation.phoneInvalid"),
    ),
    instagram: handleField("instagram"),
    twitter: handleField("twitter"),
    facebook: handleField("facebook"),
    tiktok: handleField("tiktok"),
  };
}

export function getClubContactValues(club?: Club): ClubContactValues {
  return {
    website: club?.website || "",
    email: club?.email || "",
    phone: club?.phone || "",
    instagram: club?.instagram || "",
    twitter: club?.twitter || "",
    facebook: club?.facebook || "",
    tiktok: club?.tiktok || "",
  };
}

/** Validated form values -> updateClub variables ("" clears a field). */
export function toClubContactVariables(
  values: ClubContactValues,
): Pick<UpdateClubVariables, ClubContactFieldName> {
  const handle = (platform: SocialPlatform) =>
    normalizeSocialHandle(platform, values[platform]) ?? "";

  return {
    website: toWebsiteUrl(values.website) ?? "",
    email: values.email,
    phone: values.phone,
    instagram: handle("instagram"),
    twitter: handle("twitter"),
    facebook: handle("facebook"),
    tiktok: handle("tiktok"),
  };
}

interface FieldConfig {
  name: ClubContactFieldName;
  icon: LucideIcon;
  inputMode: "url" | "email" | "tel" | "text";
  autoComplete?: string;
  placeholderKey: string;
}

// type="text" on purpose: native url/email validation would block the submit
// with a browser bubble before zod can show the translated message.
const CONTACT_FIELDS: FieldConfig[] = [
  { name: "website", icon: Globe, inputMode: "url", autoComplete: "url", placeholderKey: "website" },
  { name: "email", icon: Mail, inputMode: "email", autoComplete: "email", placeholderKey: "email" },
  { name: "phone", icon: Phone, inputMode: "tel", autoComplete: "tel", placeholderKey: "phone" },
];

const SOCIAL_ICONS: Record<SocialPlatform, LucideIcon> = {
  instagram: Instagram,
  twitter: Twitter,
  facebook: Facebook,
  tiktok: Music,
};

const SOCIAL_FIELDS: FieldConfig[] = SOCIAL_PLATFORMS.map((platform) => ({
  name: platform,
  icon: SOCIAL_ICONS[platform],
  inputMode: "text",
  placeholderKey: "handle",
}));

interface ClubContactFieldsProps {
  control: Control<ClubFormValues>;
  t: (key: string) => string;
}

export function ClubContactFields({ control, t }: ClubContactFieldsProps) {
  const renderField = ({ name, icon: Icon, inputMode, autoComplete, placeholderKey }: FieldConfig) => (
    <FormField
      key={name}
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="gap-1.5">
            <Icon aria-hidden className="size-4 text-foreground-muted" />
            {t(`editForm.club.contact.${name}`)}
          </FormLabel>
          <FormControl>
            <Input
              type="text"
              inputMode={inputMode}
              autoComplete={autoComplete}
              spellCheck={false}
              placeholder={t(`editForm.club.contact.placeholders.${placeholderKey}`)}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Card className="bg-background">
      <CardHeader>
        <CardTitle>{t("editForm.club.contact.title")}</CardTitle>
        <CardDescription>{t("editForm.club.contact.desc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CONTACT_FIELDS.map(renderField)}
        </div>
        <div className="space-y-4 border-t border-border pt-6">
          <p className="text-sm font-medium text-foreground">
            {t("editForm.club.contact.socialsTitle")}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SOCIAL_FIELDS.map(renderField)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
