"use client";

import type { ReactNode } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Controller, UseFormReturn } from "react-hook-form";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { FieldError } from "./register-field-error";
import { ClubNameField } from "./register-club-steps";

/**
 * Steps 1 (role) and 2 (basic data) of the register flow, with the step
 * indicator. Step 3 lives in register-role-steps.tsx and register-club-steps.tsx.
 */

// ---------------------------------------------------------------------------
// Role card definitions
// ---------------------------------------------------------------------------

export type RoleCardId = "player" | "coach" | "umpire" | "clubAdmin";

interface RoleCard {
  id: RoleCardId;
  icon: string;
  backendRole: string;
}

export const ROLE_CARDS: RoleCard[] = [
  { id: "player", icon: "🏃", backendRole: "PLAYER" },
  { id: "coach", icon: "📋", backendRole: "COACH" },
  { id: "umpire", icon: "🏁", backendRole: "UMPIRE" },
  { id: "clubAdmin", icon: "🏟️", backendRole: "CLUB" },
];

// The country combobox (cmdk + popover) is only needed from step 2 on, so it
// stays out of the page's first-load JS.
const CountrySelect = dynamic(
  () => import("@/components/ui/country-select").then((m) => m.CountrySelect),
  {
    ssr: false,
    loading: () => <div className="h-9 w-full rounded-md border border-input" />,
  },
);

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

export function StepIndicator({ currentStep }: { currentStep: number }) {
  const t = useTranslations("register");
  const labels = [
    t("stepRoleTitle"),
    t("stepBasicTitle"),
    t("stepRoleDataTitle"),
  ];

  return (
    <div className="flex items-center justify-center mb-3 sm:mb-6 gap-0">
      {[1, 2, 3].map((n, i) => (
        <div key={n} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                currentStep === n
                  ? "bg-primary text-white"
                  : currentStep > n
                    ? "bg-primary/20 text-primary"
                    : "bg-border text-foreground/40"
              }`}
            >
              {n}
            </div>
            <span
              className={`text-[10px] font-medium text-center max-w-[72px] leading-tight ${
                currentStep >= n ? "text-foreground/70" : "text-foreground/30"
              }`}
            >
              {labels[i]}
            </span>
          </div>
          {i < 2 && (
            <div
              className={`h-px w-8 mx-1 mb-5 shrink-0 transition-colors ${
                currentStep > n ? "bg-primary/40" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 form types & schema
// ---------------------------------------------------------------------------

export type Step2Data = {
  firstName: string;
  lastName: string;
  /** Only asked (and sent) for a CLUB account: it is the account name. */
  clubName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  country: string;
  terms: boolean;
};

// ---------------------------------------------------------------------------
// Step 1: Role selection
// ---------------------------------------------------------------------------

interface Step1RoleSelectProps {
  t: (key: string) => string;
  selectedRole: RoleCardId | null;
  roleError: boolean;
  onSelectRole: (id: RoleCardId) => void;
  onNext: () => void;
  onLoginClick: () => void;
}

export function Step1RoleSelect({
  t,
  selectedRole,
  roleError,
  onSelectRole,
  onNext,
  onLoginClick,
}: Step1RoleSelectProps) {
  return (
    <div>
      <h3 className="text-base font-semibold text-foreground mb-4">
        {t("stepRoleTitle")}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {ROLE_CARDS.map((card) => {
          const isSelected = selectedRole === card.id;
          return (
            <button
              key={card.id}
              type="button"
              data-testid={`role-card-${card.id}`}
              onClick={() => onSelectRole(card.id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all cursor-pointer text-center ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40 bg-background"
              }`}
            >
              <span className="text-2xl">{card.icon}</span>
              <span className="text-xs font-semibold text-foreground leading-tight">
                {t(`roles.${card.id === "clubAdmin" ? "clubAdmin" : card.id}`)}
              </span>
              <span className="text-[10px] text-foreground/50 leading-tight">
                {t(`roleDescriptions.${card.id}`)}
              </span>
            </button>
          );
        })}
      </div>
      {roleError && (
        <p className="text-error text-xs mb-3">{t("roleSelectError")}</p>
      )}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        type="button"
        onClick={onNext}
        className="w-full h-9 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors cursor-pointer flex items-center justify-center gap-1 text-sm"
      >
        {t("next")} <ChevronRight size={16} />
      </motion.button>
      <p className="text-center text-xs text-foreground/50 mt-3">
        {t("alreadyHaveAccount")}{" "}
        <button
          type="button"
          onClick={onLoginClick}
          className="text-primary hover:underline cursor-pointer"
        >
          {t("loginLink")}
        </button>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Basic data
// ---------------------------------------------------------------------------

/** Opens in a new tab so the data typed in the register modal is not lost. */
export function LegalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:underline"
    >
      {children}
    </a>
  );
}

/** First + last name of the person registering (every role but CLUB). */
function PersonNameFields({
  t,
  form,
}: {
  t: (key: string) => string;
  form: UseFormReturn<Step2Data>;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label htmlFor="firstName" className="mb-1 text-sm">
          {t("firstName")}
        </Label>
        <div className="relative">
          <User
            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground"
            size={16}
          />
          <Input
            {...form.register("firstName")}
            id="firstName"
            placeholder={t("placeholders.firstName")}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <FieldError message={form.formState.errors.firstName?.message} />
      </div>
      <div>
        <Label htmlFor="lastName" className="mb-1 text-sm">
          {t("lastName")}
        </Label>
        <div className="relative">
          <User
            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground"
            size={16}
          />
          <Input
            {...form.register("lastName")}
            id="lastName"
            placeholder={t("placeholders.lastName")}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <FieldError message={form.formState.errors.lastName?.message} />
      </div>
    </div>
  );
}

interface Step2BasicDataProps {
  t: (key: string) => string;
  /** Rich text with the terms and privacy links (needs t.rich, built by the parent). */
  termsLabel: ReactNode;
  form: UseFormReturn<Step2Data>;
  /** A club is named instead of asking for a person's first and last name. */
  isClub: boolean;
  showPassword: boolean;
  showConfirmPassword: boolean;
  onTogglePassword: () => void;
  onToggleConfirmPassword: () => void;
  onBack: () => void;
  onNext: () => void;
  onCheckAvailability: (field: "email" | "username") => void;
}

export function Step2BasicData({
  t,
  termsLabel,
  form,
  isClub,
  showPassword,
  showConfirmPassword,
  onTogglePassword,
  onToggleConfirmPassword,
  onBack,
  onNext,
  onCheckAvailability,
}: Step2BasicDataProps) {
  // A server-side error (taken, rate limit...) is stale once the user edits
  const clearServerError = (field: "email" | "username") => {
    if (form.formState.errors[field]?.type === "server") {
      form.clearErrors(field);
    }
  };

  return (
    <form className="space-y-3">
      <h3 className="text-base font-semibold text-foreground mb-1">
        {t("stepBasicTitle")}
      </h3>

      {isClub ? (
        <ClubNameField
          t={t}
          registration={form.register("clubName")}
          error={form.formState.errors.clubName?.message}
        />
      ) : (
        <PersonNameFields t={t} form={form} />
      )}

      {/* Username */}
      <div>
        <Label htmlFor="username" className="mb-1 text-sm">
          {t("username")}
        </Label>
        <div className="relative">
          <User
            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground"
            size={16}
          />
          <Input
            {...form.register("username", {
              onChange: () => clearServerError("username"),
              onBlur: () => onCheckAvailability("username"),
            })}
            autoComplete="username"
            autoCapitalize="none"
            id="username"
            placeholder={t("placeholders.username")}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <FieldError message={form.formState.errors.username?.message} />
      </div>

      {/* Email */}
      <div>
        <Label htmlFor="reg-email" className="mb-1 text-sm">
          {t("email")}
        </Label>
        <div className="relative">
          <Mail
            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground"
            size={16}
          />
          <Input
            {...form.register("email", {
              onChange: () => clearServerError("email"),
              onBlur: () => onCheckAvailability("email"),
            })}
            autoComplete="email"
            id="reg-email"
            type="email"
            placeholder={t("placeholders.email")}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <FieldError message={form.formState.errors.email?.message} />
      </div>

      {/* Password */}
      <div>
        <Label htmlFor="reg-password" className="mb-1 text-sm">
          {t("password")}
        </Label>
        <div className="relative">
          <Lock
            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground"
            size={16}
          />
          <Input
            {...form.register("password")}
            autoComplete="new-password"
            id="reg-password"
            type={showPassword ? "text" : "password"}
            placeholder={t("placeholders.password")}
            className="pl-9 pr-9 h-9 text-sm"
          />
          <button
            type="button"
            onClick={onTogglePassword}
            aria-label={showPassword ? t("hidePassword") : t("showPassword")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground cursor-pointer"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <FieldError message={form.formState.errors.password?.message} />
      </div>

      {/* Confirm password */}
      <div>
        <Label htmlFor="confirmPassword" className="mb-1 text-sm">
          {t("confirmPassword")}
        </Label>
        <div className="relative">
          <Lock
            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground"
            size={16}
          />
          <Input
            {...form.register("confirmPassword")}
            autoComplete="new-password"
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder={t("placeholders.password")}
            className="pl-9 pr-9 h-9 text-sm"
          />
          <button
            type="button"
            onClick={onToggleConfirmPassword}
            aria-label={showConfirmPassword ? t("hidePassword") : t("showPassword")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground cursor-pointer"
          >
            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <FieldError message={form.formState.errors.confirmPassword?.message} />
      </div>

      {/* Country */}
      <div>
        <Label htmlFor="country" className="mb-1 text-sm">
          {t("country")}
        </Label>
        <Controller
          control={form.control}
          name="country"
          render={({ field }) => (
            <CountrySelect
              id="country"
              ref={field.ref}
              name={field.name}
              value={field.value}
              onChange={(code) => field.onChange(code ?? "")}
              onBlur={field.onBlur}
              placeholder={t("placeholders.country")}
              aria-invalid={!!form.formState.errors.country}
              className="h-9 text-sm"
            />
          )}
        />
        <FieldError message={form.formState.errors.country?.message} />
      </div>

      {/* Terms */}
      <div className="flex items-start gap-2 pt-1">
        <input
          {...form.register("terms")}
          id="terms"
          type="checkbox"
          className="mt-0.5 accent-primary cursor-pointer"
        />
        <Label
          htmlFor="terms"
          className="text-xs text-foreground/70 cursor-pointer leading-relaxed"
        >
          {termsLabel}
        </Label>
      </div>
      {form.formState.errors.terms && (
        <p className="text-error text-xs">
          {form.formState.errors.terms.message}
        </p>
      )}

      {/* Navigation */}
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
          type="button"
          onClick={onNext}
          className="flex-1 h-9 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors cursor-pointer flex items-center justify-center gap-1 text-sm"
        >
          {t("next")} <ChevronRight size={16} />
        </motion.button>
      </div>
    </form>
  );
}
