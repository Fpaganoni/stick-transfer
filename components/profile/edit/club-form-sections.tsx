"use client";

import type { Control } from "react-hook-form";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ImageUploadField } from "./shared-sections";
import type { ClubFormValues } from "./club-form-model";

interface SectionProps {
  control: Control<ClubFormValues>;
  t: (key: string) => string;
}

/** Where the club stands in the verification that protects its name. */
export function ClubVerificationBadge({ status, t }: { status?: string; t: (key: string) => string }) {
  const normalized = (status || "UNVERIFIED").toUpperCase();

  if (normalized === "VERIFIED") {
    return (
      <Badge className="bg-success/30 text-foreground border-success/40 gap-1">
        <CheckCircle size={14} />
        {t("editForm.club.verified")}
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

/** Name, @username, bio, crest and cover: the identity of the account and of the club. */
export function ClubIdentityCard({
  control,
  t,
  verificationStatus,
}: SectionProps & { verificationStatus?: string }) {
  return (
    <Card className="bg-background">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>{t("editForm.club.identityTitle")}</CardTitle>
          <CardDescription>{t("editForm.club.identityDesc")}</CardDescription>
        </div>
        <ClubVerificationBadge status={verificationStatus} t={t} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("editForm.club.name")}</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="organization"
                    placeholder={t("editForm.club.placeholders.name")}
                    {...field}
                  />
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
                  <Input
                    autoComplete="username"
                    autoCapitalize="none"
                    placeholder={t("editForm.placeholders.username")}
                    {...field}
                  />
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
                  className="resize-none"
                  placeholder={t("editForm.club.placeholders.bio")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="logo"
          render={({ field }) => (
            <ImageUploadField
              target="CLUB_LOGO"
              variant="logo"
              label={t("editForm.club.crest")}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />

        <FormField
          control={control}
          name="coverImage"
          render={({ field }) => (
            <ImageUploadField
              target="CLUB_COVER"
              label={t("editForm.club.cover")}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </CardContent>
    </Card>
  );
}

/** Description, league, foundation year and benefits shown on the public profile. */
export function ClubDetailsCard({ control, t }: SectionProps) {
  return (
    <Card className="bg-background">
      <CardHeader>
        <CardTitle>{t("editForm.club.detailsTitle")}</CardTitle>
        <CardDescription>{t("editForm.club.detailsDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("editForm.club.description")}</FormLabel>
              <FormControl>
                <Textarea
                  className="resize-none"
                  rows={5}
                  placeholder={t("editForm.club.placeholders.description")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="league"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("editForm.club.league")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("editForm.club.placeholders.league")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="foundedYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("editForm.club.foundedYear")}</FormLabel>
                <FormControl>
                  <Input
                    inputMode="numeric"
                    maxLength={4}
                    placeholder={t("editForm.club.placeholders.foundedYear")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="benefits"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("editForm.club.benefits")}</FormLabel>
              <FormControl>
                <Input placeholder={t("editForm.club.placeholders.benefits")} {...field} />
              </FormControl>
              <FormDescription>{t("editForm.club.benefitsHint")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}

/** The person who manages the account. Private: never shown on the public page. */
export function ClubResponsibleCard({ control, t }: SectionProps) {
  return (
    <Card className="bg-background">
      <CardHeader>
        <CardTitle>{t("editForm.club.managedByTitle")}</CardTitle>
        <CardDescription>{t("editForm.club.managedByDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="managedByFirstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("editForm.club.managedByFirstName")}</FormLabel>
              <FormControl>
                <Input
                  autoComplete="given-name"
                  placeholder={t("editForm.club.placeholders.managedByFirstName")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="managedByLastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("editForm.club.managedByLastName")}</FormLabel>
              <FormControl>
                <Input
                  autoComplete="family-name"
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
  );
}
