"use client";

import { ChevronLeft, User } from "lucide-react";
import type { SubmitHandler, UseFormRegisterReturn, UseFormReturn } from "react-hook-form";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "./register-field-error";

/**
 * Register fields that only a CLUB account sees. The account IS the club: step 2
 * asks for the club name and step 3 for the place and the person in charge.
 */

/** Step 3 of a club. The country was already chosen on step 2. */
export type Step3ClubData = {
  city: string;
  managedByFirstName: string;
  managedByLastName: string;
};

interface ClubNameFieldProps {
  t: (key: string) => string;
  registration: UseFormRegisterReturn<"clubName">;
  error?: string;
}

/** Step 2: replaces the first and last name inputs. */
export function ClubNameField({ t, registration, error }: ClubNameFieldProps) {
  return (
    <div>
      <Label htmlFor="clubName" className="mb-1 text-sm">
        {t("clubName")}
      </Label>
      <div className="relative">
        <User
          className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground"
          size={16}
        />
        <Input
          {...registration}
          id="clubName"
          autoComplete="organization"
          placeholder={t("placeholders.clubName")}
          className="pl-9 h-9 text-sm"
        />
      </div>
      <FieldError message={error} />
    </div>
  );
}

interface Step3ClubDataFormProps {
  t: (key: string) => string;
  form: UseFormReturn<Step3ClubData>;
  isRegistering: boolean;
  onBack: () => void;
  onSubmit: SubmitHandler<Step3ClubData>;
}

export function Step3ClubDataForm({
  t,
  form,
  isRegistering,
  onBack,
  onSubmit,
}: Step3ClubDataFormProps) {
  const { errors } = form.formState;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
      {/* City */}
      <div>
        <Label htmlFor="city" className="mb-1 text-sm">
          {t("city")}
        </Label>
        <Input
          {...form.register("city")}
          id="city"
          placeholder={t("placeholders.city")}
          className="h-9 text-sm"
        />
        <FieldError message={errors.city?.message} />
      </div>

      {/* Person in charge: private, never shown on the public club page */}
      <div className="pt-1">
        <h4 className="text-sm font-semibold text-foreground">{t("responsiblePerson")}</h4>
        <p className="text-xs text-foreground/60">{t("responsiblePersonHint")}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="managedByFirstName" className="mb-1 text-sm">
            {t("firstName")}
          </Label>
          <Input
            {...form.register("managedByFirstName")}
            id="managedByFirstName"
            autoComplete="given-name"
            placeholder={t("placeholders.firstName")}
            className="h-9 text-sm"
          />
          <FieldError message={errors.managedByFirstName?.message} />
        </div>
        <div>
          <Label htmlFor="managedByLastName" className="mb-1 text-sm">
            {t("lastName")}
          </Label>
          <Input
            {...form.register("managedByLastName")}
            id="managedByLastName"
            autoComplete="family-name"
            placeholder={t("placeholders.lastName")}
            className="h-9 text-sm"
          />
          <FieldError message={errors.managedByLastName?.message} />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={onBack}
          className="h-9 px-4 border border-border rounded-lg text-sm font-medium hover:bg-border/30 transition-colors cursor-pointer flex items-center gap-1"
        >
          <ChevronLeft size={16} /> {t("back")}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={isRegistering}
          className="flex-1 h-9 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors cursor-pointer disabled:opacity-50 text-sm"
        >
          {isRegistering ? t("creatingProfile") : t("createProfile")}
        </motion.button>
      </div>
    </form>
  );
}
