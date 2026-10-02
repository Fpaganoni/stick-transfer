"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useCreateJobOpportunity } from "@/hooks/useJobOpportunities";
import {
  Level,
  UmpireLicenseLevel,
  UmpireModality,
  UmpireCategory,
} from "@/types/enums";
import { POSITION_TYPES, isUmpireJob } from "@/lib/job-position-type";
import type { CreateJobOpportunityVariables } from "@/types/models/job-opportunity";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ACTIVE_LIMIT_ERROR_HINT = "limit";

const createOpportunitySchema = (t: (key: string) => string) =>
  z.object({
    title: z.string().min(1, { message: t("create.validation.titleRequired") }),
    description: z
      .string()
      .min(1, { message: t("create.validation.descriptionRequired") }),
    positionType: z
      .string()
      .min(1, { message: t("create.validation.positionTypeRequired") }),
    level: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    salary: z.coerce.number().min(0).optional(),
    currency: z.string().optional(),
    benefits: z.string().optional(),
    // UMPIRE only; "" means not set
    licenseLevelRequired: z.string().optional(),
    modality: z.string().optional(),
    umpireCategory: z.string().optional(),
    matchDate: z.string().optional(),
  });

type OpportunityFormValues = z.infer<ReturnType<typeof createOpportunitySchema>>;

export function CreateOpportunityForm() {
  const router = useRouter();
  const t = useTranslations("opportunities");
  const tUmpire = useTranslations("umpire");
  const tCommon = useTranslations("common");
  const { mutateAsync: createJobOpportunity } = useCreateJobOpportunity();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = createOpportunitySchema(t);
  const form = useForm<OpportunityFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      positionType: "",
      level: Level.PROFESSIONAL,
      country: "",
      city: "",
      currency: "USD",
      benefits: "",
      licenseLevelRequired: "",
      modality: "",
      umpireCategory: "",
      matchDate: "",
    },
  });
  const isUmpire = isUmpireJob(
    useWatch({ control: form.control, name: "positionType" }),
  );

  async function onSubmit(data: OpportunityFormValues) {
    setIsSubmitting(true);
    try {
      const benefits = data.benefits
        ? data.benefits.split(",").map((b) => b.trim()).filter(Boolean)
        : [];

      // Only for UMPIRE jobs, and only what was filled in: the backend
      // answers 400 if these arrive on any other position type.
      const umpireFields: Partial<CreateJobOpportunityVariables> = {};
      if (isUmpireJob(data.positionType)) {
        if (data.licenseLevelRequired)
          umpireFields.licenseLevelRequired =
            data.licenseLevelRequired as UmpireLicenseLevel;
        if (data.modality) umpireFields.modality = data.modality as UmpireModality;
        if (data.umpireCategory)
          umpireFields.umpireCategory = data.umpireCategory as UmpireCategory;
        if (data.matchDate)
          umpireFields.matchDate = new Date(data.matchDate).toISOString();
      }

      await createJobOpportunity({
        title: data.title,
        description: data.description,
        positionType: data.positionType,
        level: data.level,
        country: data.country,
        city: data.city,
        salary: data.salary,
        currency: data.currency,
        benefits,
        ...umpireFields,
      });

      toast.success(t("create.successTitle"), {
        description: t("create.successDescription"),
      });
      router.push("/opportunities");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      if (message.toLowerCase().includes(ACTIVE_LIMIT_ERROR_HINT)) {
        toast.error(t("create.errorTitle"), {
          description: t("create.activeLimitReached"),
        });
      } else {
        toast.error(t("create.errorTitle"));
      }
      console.error("Error creating job opportunity:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const triggerClass =
    "w-full bg-input border-border text-foreground text-sm hover:border-border-strong";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="bg-background">
          <CardHeader>
            <CardTitle>{t("create.title")}</CardTitle>
            <CardDescription>{t("create.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("create.titleLabel")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("create.titlePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("create.descriptionLabel")}</FormLabel>
                  <FormControl>
                    <Textarea
                      className="resize-none min-h-32"
                      placeholder={t("create.descriptionPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="positionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("create.positionTypeLabel")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className={triggerClass}>
                          <SelectValue placeholder={t("create.positionTypeLabel")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {POSITION_TYPES.map((pos) => (
                          <SelectItem key={pos} value={pos}>
                            {t(`positionTypes.${pos}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("create.levelLabel")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className={triggerClass}>
                          <SelectValue placeholder={t("create.levelLabel")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={Level.PROFESSIONAL}>Professional</SelectItem>
                        <SelectItem value={Level.AMATEUR}>Amateur</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("create.countryLabel")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>{t("create.cityLabel")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("create.salaryLabel")}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("create.currencyLabel")}</FormLabel>
                    <FormControl>
                      <Input placeholder="USD" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isUmpire && (
              <div className="space-y-4 rounded-md border border-input p-4">
                <div>
                  <h3 className="text-sm font-semibold">{t("umpireJob.title")}</h3>
                  <p className="text-xs text-foreground-muted">
                    {t("umpireJob.createHint")}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <UmpireSelectField
                    control={form.control}
                    name="licenseLevelRequired"
                    label={t("umpireJob.licenseLevel")}
                    anyLabel={t("umpireJob.any")}
                    triggerClass={triggerClass}
                    options={Object.values(UmpireLicenseLevel).map((v) => ({
                      value: v,
                      label: tUmpire(`licenseLevels.${v}`),
                    }))}
                  />
                  <UmpireSelectField
                    control={form.control}
                    name="modality"
                    label={t("umpireJob.modality")}
                    anyLabel={t("umpireJob.any")}
                    triggerClass={triggerClass}
                    options={Object.values(UmpireModality).map((v) => ({
                      value: v,
                      label: tUmpire(`modalities.${v}`),
                    }))}
                  />
                  <UmpireSelectField
                    control={form.control}
                    name="umpireCategory"
                    label={t("umpireJob.category")}
                    anyLabel={t("umpireJob.any")}
                    triggerClass={triggerClass}
                    options={Object.values(UmpireCategory).map((v) => ({
                      value: v,
                      label: tUmpire(`categories.${v}`),
                    }))}
                  />
                  <FormField
                    control={form.control}
                    name="matchDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("umpireJob.matchDate")}</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="benefits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("create.benefitsLabel")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("create.benefitsPlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pb-10">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/opportunities")}
            disabled={isSubmitting}
          >
            {tCommon("cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("create.submitting") : t("create.submit")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface UmpireSelectFieldProps {
  control: Control<OpportunityFormValues>;
  name: "licenseLevelRequired" | "modality" | "umpireCategory";
  label: string;
  anyLabel: string;
  triggerClass: string;
  options: { value: string; label: string }[];
}

/** Optional enum select; "any" clears it so nothing is sent for that field. */
function UmpireSelectField({
  control,
  name,
  label,
  anyLabel,
  triggerClass,
  options,
}: UmpireSelectFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            value={field.value || "ANY"}
            onValueChange={(v) => field.onChange(v === "ANY" ? "" : v)}
          >
            <FormControl>
              <SelectTrigger className={triggerClass}>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="ANY">{anyLabel}</SelectItem>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
