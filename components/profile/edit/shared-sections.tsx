"use client";

import type { Control } from "react-hook-form";
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
            <FormItem>
              <FormLabel>{t("editForm.avatarUrl")}</FormLabel>
              <FormControl>
                <Input placeholder={t("editForm.placeholders.avatarUrl")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="coverImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("editForm.coverImageUrl") || "Cover Image URL"}</FormLabel>
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
  );
}

interface PlayerDetailsSectionProps {
  control: AnyControl;
  t: (key: string) => string;
}

/** Position and years of experience — only meaningful for PLAYER/COACH. */
export function PlayerDetailsSection({ control, t }: PlayerDetailsSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={control}
        name="position"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("editForm.position")}</FormLabel>
            <FormControl>
              <Input placeholder={t("editForm.placeholders.position")} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
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
