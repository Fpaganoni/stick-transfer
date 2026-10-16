"use client";

import { ChevronLeft } from "lucide-react";
import type { SubmitHandler, UseFormRegisterReturn, UseFormReturn } from "react-hook-form";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDobBounds } from "@/lib/date-of-birth";
import { POSITION_OPTIONS } from "@/lib/positions";
import { FieldError } from "./register-field-error";

/**
 * Step 3 of the register flow for the player, coach and umpire roles. The club
 * has its own step 3 in register-club-steps.tsx.
 */

// ---------------------------------------------------------------------------
// Step 3 form types
// ---------------------------------------------------------------------------

export type Step3PlayerData = { position: string; dateOfBirth?: string };
export type Step3CoachData = { dateOfBirth?: string };
export type Step3UmpireData = { city: string; dateOfBirth?: string };

// ---------------------------------------------------------------------------
// Step 3: Role-specific data
// ---------------------------------------------------------------------------

interface DateOfBirthFieldProps {
  id: string;
  label: string;
  registration: UseFormRegisterReturn<"dateOfBirth">;
  error?: string;
}

/**
 * Optional birth date; the native picker only offers the 16 to 100 years range.
 * Forms using it set noValidate so a typed out of range date shows the
 * translated zod message instead of the browser bubble.
 */
export function DateOfBirthField({ id, label, registration, error }: DateOfBirthFieldProps) {
  const { min, max } = getDobBounds();
  return (
    <div>
      <Label htmlFor={id} className="mb-1 text-sm">
        {label}
      </Label>
      <Input
        {...registration}
        id={id}
        type="date"
        min={min}
        max={max}
        className="h-9 text-sm"
      />
      <FieldError message={error} />
    </div>
  );
}

interface Step3PlayerDataProps {
  t: (key: string) => string;
  tExplore: (key: string) => string;
  form: UseFormReturn<Step3PlayerData>;
  isRegistering: boolean;
  onBack: () => void;
  onSubmit: SubmitHandler<Step3PlayerData>;
}

export function Step3PlayerDataForm({
  t,
  tExplore,
  form,
  isRegistering,
  onBack,
  onSubmit,
}: Step3PlayerDataProps) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-3">
      {/* Preferred position */}
      <div>
        <Label htmlFor="position" className="mb-1 text-sm">
          {t("preferredPosition")}
        </Label>
        <select
          {...form.register("position")}
          id="position"
          defaultValue=""
          className="w-full h-9 rounded-md border border-input bg-background text-foreground text-sm px-3 focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
        >
          <option value="" disabled>
            {t("placeholders.preferredPosition")}
          </option>
          {POSITION_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {tExplore(`positions.${p.labelKey}`)}
            </option>
          ))}
        </select>
        <FieldError message={form.formState.errors.position?.message} />
      </div>

      <DateOfBirthField
        id="dateOfBirth"
        label={t("dateOfBirth")}
        registration={form.register("dateOfBirth")}
        error={form.formState.errors.dateOfBirth?.message}
      />

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

interface Step3CoachDataProps {
  t: (key: string) => string;
  form: UseFormReturn<Step3CoachData>;
  isRegistering: boolean;
  onBack: () => void;
  onSubmit: SubmitHandler<Step3CoachData>;
}

/** Coaches have no playing position: the backend only stores it for PLAYER. */
export function Step3CoachDataForm({
  t,
  form,
  isRegistering,
  onBack,
  onSubmit,
}: Step3CoachDataProps) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-3">
      <DateOfBirthField
        id="coachDateOfBirth"
        label={t("dateOfBirth")}
        registration={form.register("dateOfBirth")}
        error={form.formState.errors.dateOfBirth?.message}
      />

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

interface Step3UmpireDataProps {
  t: (key: string) => string;
  form: UseFormReturn<Step3UmpireData>;
  isRegistering: boolean;
  onBack: () => void;
  onSubmit: SubmitHandler<Step3UmpireData>;
}

export function Step3UmpireDataForm({
  t,
  form,
  isRegistering,
  onBack,
  onSubmit,
}: Step3UmpireDataProps) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-3">
      <p className="text-xs text-foreground/60">{t("umpireProfileHint")}</p>

      {/* City */}
      <div>
        <Label htmlFor="umpireCity" className="mb-1 text-sm">
          {t("city")}
        </Label>
        <Input
          {...form.register("city")}
          id="umpireCity"
          placeholder={t("placeholders.city")}
          className="h-9 text-sm"
        />
        <FieldError message={form.formState.errors.city?.message} />
      </div>

      <DateOfBirthField
        id="umpireDateOfBirth"
        label={t("dateOfBirth")}
        registration={form.register("dateOfBirth")}
        error={form.formState.errors.dateOfBirth?.message}
      />

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
