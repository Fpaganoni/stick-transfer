"use client";

import type { Control } from "react-hook-form";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { POSITION_OPTIONS } from "@/lib/positions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { FileUploader } from "@/components/clubs/file-uploader";

const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp";
const IMAGE_VALID_TYPES = ["image/jpeg", "image/png", "image/webp"];
const IMAGE_MAX_SIZE_MB = 5;

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
}

/** Photo upload field restricted to JPG/PNG/WEBP, used for avatar, cover image and club logo. */
export function ImageUploadField({ label, value, onChange }: ImageUploadFieldProps) {
  const t = useTranslations("profile.editForm.photo");

  if (value) {
    return (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <div className="flex items-center gap-3 border border-input rounded-md p-3 bg-muted/20">
          <Image
            src={value}
            alt={label}
            width={48}
            height={48}
            className="rounded-md object-cover h-12 w-12 shrink-0"
            unoptimized
          />
          <span className="text-sm text-foreground-muted truncate flex-1">{value}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("removeFile")}
            onClick={() => onChange("")}
          >
            <X className="w-4 h-4 text-error" />
          </Button>
        </div>
      </FormItem>
    );
  }

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <FileUploader
        accept={IMAGE_ACCEPT}
        validTypes={IMAGE_VALID_TYPES}
        maxSizeMB={IMAGE_MAX_SIZE_MB}
        onFileSelect={onChange}
        labels={{
          dragOrClick: t("dragOrClick"),
          supportedFormats: t("supportedFormats"),
          fileTooLarge: t("fileTooLarge"),
          invalidFileType: t("invalidFileType"),
          uploading: t("uploading"),
          uploadFailed: t("uploadFailed"),
          removeFile: t("removeFile"),
        }}
      />
      <FormMessage />
    </FormItem>
  );
}

export { Form };

export async function toBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyControl = Control<any>;

interface BasicInfoSectionProps {
  control: AnyControl;
  t: (key: string) => string;
}

/**
 * Personal/account fields shared by every role: display name, username,
 * bio and the two profile images. Role-specific fields (position, years
 * of experience, club name, etc.) live in their own sections.
 */
export function BasicInfoSection({ control, t }: BasicInfoSectionProps) {
  return (
    <Card className="bg-background">
      <CardHeader>
        <CardTitle>{t("editForm.basicInfo")}</CardTitle>
        <CardDescription>{t("editForm.basicInfoDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("editForm.name")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("editForm.placeholders.name")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("editForm.username")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("editForm.placeholders.username")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
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
          control={control}
          name="avatar"
          render={({ field }) => (
            <ImageUploadField
              label={t("editForm.avatarUrl")}
              value={field.value || ""}
              onChange={field.onChange}
            />
          )}
        />

        <FormField
          control={control}
          name="coverImage"
          render={({ field }) => (
            <ImageUploadField
              label={t("editForm.coverImageUrl") || "Cover Image URL"}
              value={field.value || ""}
              onChange={field.onChange}
            />
          )}
        />
      </CardContent>
    </Card>
  );
}

interface PlayerDetailsSectionProps {
  control: AnyControl;
  t: (key: string) => string;
  tExplore: (key: string) => string;
  /** Only PLAYER has a position; the backend ignores it for every other role. */
  showPosition: boolean;
}

/** Position (players only) and years of experience for PLAYER/COACH. */
export function PlayerDetailsSection({
  control,
  t,
  tExplore,
  showPosition,
}: PlayerDetailsSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {showPosition && (
        <FormField
          control={control}
          name="position"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("editForm.position")}</FormLabel>
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("editForm.placeholders.position")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {POSITION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {tExplore(`positions.${option.labelKey}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      <FormField
        control={control}
        name="yearsOfExperience"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("editForm.yearsOfExperience")}</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder={t("editForm.placeholders.yearsOfExperience")}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

interface LocationSectionProps {
  control: AnyControl;
  t: (key: string) => string;
}

export function LocationSection({ control, t }: LocationSectionProps) {
  return (
    <Card className="bg-background">
      <CardHeader>
        <CardTitle>{t("editForm.location")}</CardTitle>
        <CardDescription>{t("editForm.locationDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("editForm.countryCode")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("editForm.placeholders.countryCode")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("editForm.city")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("editForm.placeholders.city")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface FormActionsProps {
  tCommon: (key: string) => string;
  saveLabel: string;
  isSaving: boolean;
  onCancel: () => void;
}

export function FormActions({ tCommon, saveLabel, isSaving, onCancel }: FormActionsProps) {
  return (
    <div className="flex justify-end gap-4 mt-8 pb-10">
      <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
        {tCommon("cancel")}
      </Button>
      <Button type="submit" disabled={isSaving}>
        {saveLabel}
      </Button>
    </div>
  );
}
