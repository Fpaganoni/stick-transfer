"use client";

import { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowUpIcon,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
} from "lucide-react";
import { useForm, UseFormReturn, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserRegister } from "@/hooks/useUsers";
import { graphqlClient } from "@/lib/graphql-client";
import {
  ME,
  IS_EMAIL_AVAILABLE,
  IS_USERNAME_AVAILABLE,
} from "@/graphql/user/queries";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  byteLength,
  FIELD_ERROR_MESSAGE_KEY,
  parseApiError,
  RATE_LIMIT_COOLDOWN_SECONDS,
} from "@/lib/auth-errors";
import { useCooldown } from "@/hooks/useCooldown";
import { useTranslations } from "next-intl";
import { useUIStore } from "@/stores/useUIStore";

// ---------------------------------------------------------------------------
// Role card definitions
// ---------------------------------------------------------------------------

type RoleCardId = "player" | "coach" | "umpire" | "clubAdmin";

interface RoleCard {
  id: RoleCardId;
  icon: string;
  backendRole: string;
}

const ROLE_CARDS: RoleCard[] = [
  { id: "player", icon: "🏃", backendRole: "PLAYER" },
  { id: "coach", icon: "📋", backendRole: "COACH" },
  { id: "umpire", icon: "🏁", backendRole: "UMPIRE" },
  { id: "clubAdmin", icon: "🏟️", backendRole: "CLUB" },
];

const HOCKEY_COUNTRIES = [
  "Argentina",
  "Australia",
  "Austria",
  "Belgium",
  "Canada",
  "Chile",
  "China",
  "Egypt",
  "England",
  "France",
  "Germany",
  "India",
  "Ireland",
  "Italy",
  "Japan",
  "Malaysia",
  "Netherlands",
  "New Zealand",
  "Pakistan",
  "Portugal",
  "Scotland",
  "South Africa",
  "South Korea",
  "Spain",
  "Switzerland",
  "United States",
  "Uruguay",
  "Wales",
];

const POSITIONS = [
  { value: "goalkeeper", labelKey: "goalkeeper" },
  { value: "defender", labelKey: "defender" },
  { value: "midfielder", labelKey: "midfielder" },
  { value: "attacker", labelKey: "forward" },
];

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

function StepIndicator({ currentStep }: { currentStep: number }) {
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
// Validation error helper
// ---------------------------------------------------------------------------

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex gap-1 text-error bg-error/20 font-semibold p-1 text-xs mt-1"
    >
      <ArrowUpIcon size={14} className="shrink-0 mt-px" />
      {message}
    </motion.p>
  );
}

// ---------------------------------------------------------------------------
// Step 2 form types & schema
// ---------------------------------------------------------------------------

type Step2Data = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  country: string;
  terms: boolean;
};

// ---------------------------------------------------------------------------
// Step 3 form types
// ---------------------------------------------------------------------------

type Step3PlayerData = { position: string; dateOfBirth?: string };
type Step3ClubData = { name: string; city: string; country: string };
type Step3UmpireData = { city: string; dateOfBirth?: string };

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

function Step1RoleSelect({
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

interface Step2BasicDataProps {
  t: (key: string) => string;
  form: UseFormReturn<Step2Data>;
  showPassword: boolean;
  showConfirmPassword: boolean;
  onTogglePassword: () => void;
  onToggleConfirmPassword: () => void;
  onBack: () => void;
  onNext: () => void;
  onCheckAvailability: (field: "email" | "username") => void;
}

function Step2BasicData({
  t,
  form,
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

      {/* First + Last name */}
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
        <select
          {...form.register("country")}
          id="country"
          defaultValue=""
          className="w-full h-9 rounded-md border border-input bg-background text-foreground text-sm px-3 focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
        >
          <option value="" disabled>
            {t("placeholders.country")}
          </option>
          {HOCKEY_COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
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
          {t("termsAndConditions")}
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

// ---------------------------------------------------------------------------
// Step 3: Role-specific data
// ---------------------------------------------------------------------------

interface Step3ClubDataProps {
  t: (key: string) => string;
  form: UseFormReturn<Step3ClubData>;
  isRegistering: boolean;
  onBack: () => void;
  onSubmit: SubmitHandler<Step3ClubData>;
}

function Step3ClubDataForm({
  t,
  form,
  isRegistering,
  onBack,
  onSubmit,
}: Step3ClubDataProps) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
      {/* Club name */}
      <div>
        <Label htmlFor="clubName" className="mb-1 text-sm">
          {t("clubName")}
        </Label>
        <Input
          {...form.register("name")}
          id="clubName"
          placeholder={t("placeholders.clubName")}
          className="h-9 text-sm"
        />
        <FieldError message={form.formState.errors.name?.message} />
      </div>

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
        <FieldError message={form.formState.errors.city?.message} />
      </div>

      {/* Country */}
      <div>
        <Label htmlFor="clubCountry" className="mb-1 text-sm">
          {t("country")}
        </Label>
        <select
          {...form.register("country")}
          id="clubCountry"
          defaultValue=""
          className="w-full h-9 rounded-md border border-input bg-background text-foreground text-sm px-3 focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
        >
          <option value="" disabled>
            {t("placeholders.country")}
          </option>
          {HOCKEY_COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <FieldError message={form.formState.errors.country?.message} />
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

interface Step3PlayerDataProps {
  t: (key: string) => string;
  tExplore: (key: string) => string;
  form: UseFormReturn<Step3PlayerData>;
  isRegistering: boolean;
  onBack: () => void;
  onSubmit: SubmitHandler<Step3PlayerData>;
}

function Step3PlayerDataForm({
  t,
  tExplore,
  form,
  isRegistering,
  onBack,
  onSubmit,
}: Step3PlayerDataProps) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
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
          {POSITIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {tExplore(`positions.${p.labelKey}`)}
            </option>
          ))}
        </select>
        <FieldError message={form.formState.errors.position?.message} />
      </div>

      {/* Date of birth */}
      <div>
        <Label htmlFor="dateOfBirth" className="mb-1 text-sm">
          {t("dateOfBirth")}
        </Label>
        <Input
          {...form.register("dateOfBirth")}
          id="dateOfBirth"
          type="date"
          className="h-9 text-sm"
        />
        <FieldError message={form.formState.errors.dateOfBirth?.message} />
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

interface Step3UmpireDataProps {
  t: (key: string) => string;
  form: UseFormReturn<Step3UmpireData>;
  isRegistering: boolean;
  onBack: () => void;
  onSubmit: SubmitHandler<Step3UmpireData>;
}

function Step3UmpireDataForm({
  t,
  form,
  isRegistering,
  onBack,
  onSubmit,
}: Step3UmpireDataProps) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
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

      {/* Date of birth */}
      <div>
        <Label htmlFor="umpireDateOfBirth" className="mb-1 text-sm">
          {t("dateOfBirth")}
        </Label>
        <Input
          {...form.register("dateOfBirth")}
          id="umpireDateOfBirth"
          type="date"
          className="h-9 text-sm"
        />
        <FieldError message={form.formState.errors.dateOfBirth?.message} />
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

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const RegisterPage = () => {
  const t = useTranslations("register");
  const tAuth = useTranslations("auth");
  const tValidation = useTranslations("register.validation");
  const tExplore = useTranslations("explore");
  const locale = useLocale();
  const router = useRouter();
  const { login } = useAuthStore();
  const { openLoginModal, closeRegisterModal, registerInitialRole } = useUIStore();
  const { mutate: registerUser, isPending: isRegistering } = useUserRegister();

  // A landing CTA may already have chosen the role: skip the role picker
  const initialRole =
    ROLE_CARDS.find((card) => card.id === registerInitialRole)?.id ?? null;
  const [step, setStep] = useState(initialRole ? 2 : 1);
  const [selectedRole, setSelectedRole] = useState<RoleCardId | null>(initialRole);
  const [roleError, setRoleError] = useState(false);
  const [error, setError] = useState("");
  const cooldown = useCooldown();

  const isClub = selectedRole === "clubAdmin";
  const isUmpire = selectedRole === "umpire";

  // Step 2 schema
  const step2Schema = z
    .object({
      // The backend stores the full name (max 100) as "first last".
      firstName: z
        .string()
        .trim()
        .min(2, tValidation("firstNameMin"))
        .max(49, tValidation("nameTooLong")),
      lastName: z
        .string()
        .trim()
        .min(2, tValidation("lastNameMin"))
        .max(50, tValidation("nameTooLong")),
      // Optional; backend lowercases it and checks duplicates case-insensitively
      username: z
        .string()
        .trim()
        .refine((v) => v === "" || v.length >= 3, tValidation("usernameMin"))
        .refine((v) => v.length <= 20, tValidation("usernameMax"))
        .refine(
          (v) => v === "" || /^[a-zA-Z0-9_]+$/.test(v),
          tValidation("usernameInvalid"),
        ),
      email: z
        .string()
        .trim()
        .min(1, tValidation("emailInvalid"))
        .max(254, tValidation("emailTooLong"))
        .email(tValidation("emailInvalid"))
        .regex(
          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
          tValidation("emailValid"),
        ),
      // 8-72 *bytes* (bcrypt limit): an accent or emoji counts as more than 1
      password: z
        .string()
        .min(8, tValidation("passwordMin"))
        .regex(/[a-z]/, tValidation("passwordLowercase"))
        .regex(/[A-Z]/, tValidation("passwordUppercase"))
        .regex(/[0-9]/, tValidation("passwordNumber"))
        .regex(/[^A-Za-z0-9\s]/, tValidation("passwordSpecial"))
        .refine((v) => byteLength(v) <= 72, tValidation("passwordMax")),
      confirmPassword: z
        .string()
        .min(1, tValidation("confirmPasswordRequired")),
      country: z.string().min(1, tValidation("countryRequired")),
      terms: z
        .boolean()
        .refine((v) => v === true, tValidation("termsRequired")),
    })
    .refine((d) => d.password === d.confirmPassword, {
      message: tValidation("passwordsNoMatch"),
      path: ["confirmPassword"],
    });

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: { terms: false },
  });

  // Step 3 schemas
  const step3PlayerSchema = z.object({
    position: z.string().min(1, tValidation("positionRequired")),
    dateOfBirth: z.string().optional(),
  });
  const step3ClubSchema = z.object({
    name: z.string().min(2, tValidation("clubNameRequired")),
    city: z.string().min(1, tValidation("cityRequired")),
    country: z.string().min(1, tValidation("countryRequired")),
  });

  const step3UmpireSchema = z.object({
    city: z.string().min(1, tValidation("cityRequired")),
    dateOfBirth: z.string().optional(),
  });

  const step3PlayerForm = useForm<Step3PlayerData>({
    resolver: zodResolver(step3PlayerSchema),
  });
  const step3ClubForm = useForm<Step3ClubData>({
    resolver: zodResolver(step3ClubSchema),
  });
  const step3UmpireForm = useForm<Step3UmpireData>({
    resolver: zodResolver(step3UmpireSchema),
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Navigation
  const handleNext = async () => {
    if (step === 1) {
      if (!selectedRole) {
        setRoleError(true);
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const valid = await step2Form.trigger();
      if (valid) setStep(3);
    }
  };

  const handleBack = () => setStep((s) => s - 1);

  const serverMessage = (code: string): string | null => {
    const key = FIELD_ERROR_MESSAGE_KEY[code];
    return key ? tValidation(key) : null;
  };

  // Maps the backend's extensions.code / fields onto the right input. Step 2
  // fields send the user back to step 2; step 3 fields stay where they are.
  const handleRegisterError = (err: unknown) => {
    const parsed = parseApiError(err);
    const opts = { type: "server" } as const;
    const focusStep2 = (field: keyof Step2Data) => {
      setStep(2);
      // the step 2 inputs remount; wait a tick before focusing
      setTimeout(() => step2Form.setFocus(field), 0);
    };

    switch (parsed.code) {
      case "EMAIL_TAKEN":
        step2Form.setError("email", {
          ...opts,
          message: tValidation("emailTaken"),
        });
        focusStep2("email");
        return;
      case "USERNAME_TAKEN":
        step2Form.setError("username", {
          ...opts,
          message: tValidation("usernameTaken"),
        });
        focusStep2("username");
        return;
      case "VALIDATION_ERROR": {
        let firstStep2Field: keyof Step2Data | null = null;
        let unplaced = false;

        for (const { field, code } of parsed.fields) {
          const message = serverMessage(code);
          const step2Field: keyof Step2Data | undefined = (
            {
              email: "email",
              password: "password",
              username: "username",
              name: "firstName",
              country: "country",
              managedByFirstName: "firstName",
              managedByLastName: "lastName",
            } as const
          )[field as string];

          if (message && step2Field) {
            step2Form.setError(step2Field, { ...opts, message });
            firstStep2Field ??= step2Field;
          } else if (message && field === "clubName" && isClub) {
            step3ClubForm.setError("name", { ...opts, message });
          } else if (message && field === "city" && isClub) {
            step3ClubForm.setError("city", { ...opts, message });
          } else if (message && field === "city" && isUmpire) {
            step3UmpireForm.setError("city", { ...opts, message });
          } else if (message && field === "position" && !isClub && !isUmpire) {
            step3PlayerForm.setError("position", { ...opts, message });
          } else {
            unplaced = true;
          }
        }

        if (firstStep2Field) focusStep2(firstStep2Field);
        if (unplaced || parsed.fields.length === 0) {
          setError(t("registrationFailed"));
        }
        return;
      }
      case "RATE_LIMITED":
        cooldown.start(RATE_LIMIT_COOLDOWN_SECONDS);
        setError(tAuth("tooManyAttempts"));
        return;
      case "NETWORK_ERROR":
        setError(tAuth("networkError"));
        return;
      default:
        setError(tAuth("serverError"));
    }
  };

  // onBlur availability check. Failures (incl. RATE_LIMITED) are ignored on
  // purpose: the final register call validates again anyway.
  const checkAvailability = async (field: "email" | "username") => {
    const value = step2Form.getValues(field).trim();
    if (!value || !(await step2Form.trigger(field))) return;

    try {
      const response =
        field === "email"
          ? await graphqlClient.request<{ isEmailAvailable: boolean }>(
              IS_EMAIL_AVAILABLE,
              { email: value },
            )
          : await graphqlClient.request<{ isUsernameAvailable: boolean }>(
              IS_USERNAME_AVAILABLE,
              { username: value },
            );
      const available =
        field === "email"
          ? (response as { isEmailAvailable: boolean }).isEmailAvailable
          : (response as { isUsernameAvailable: boolean }).isUsernameAvailable;

      if (available === false) {
        step2Form.setError(field, {
          type: "server",
          message: tValidation(
            field === "email" ? "emailTaken" : "usernameTaken",
          ),
        });
      }
    } catch {
      /* ignore */
    }
  };

  // Final submit
  const submitStep3 = async (
    step3Data: Step3PlayerData | Step3ClubData | Step3UmpireData,
  ) => {
    const step2Data = step2Form.getValues();
    const card = ROLE_CARDS.find((r) => r.id === selectedRole)!;
    const fullName = `${step2Data.firstName.trim()} ${step2Data.lastName.trim()}`;

    setError("");
    registerUser(
      {
        email: step2Data.email.trim(),
        name: fullName,
        username: step2Data.username.trim() || undefined,
        password: step2Data.password,
        role: card.backendRole,
        country: step2Data.country,
        ...(isClub && "name" in step3Data
          ? {
              clubName: step3Data.name,
              city: step3Data.city,
              managedByFirstName: step2Data.firstName,
              managedByLastName: step2Data.lastName,
            }
          : {}),
        ...(isUmpire && !("name" in step3Data) && !("position" in step3Data)
          ? {
              city: step3Data.city,
              dateOfBirth: step3Data.dateOfBirth || undefined,
            }
          : {}),
        ...(!isClub && !isUmpire && "position" in step3Data
          ? {
              position: step3Data.position,
              dateOfBirth: step3Data.dateOfBirth,
            }
          : {}),
      },
      {
        onSuccess: async () => {
          // Registration succeeded, but the session cookie the backend set
          // might still be rejected by the browser (Safari ITP, private
          // browsing) — that's a different problem than a bad submission.
          let fullUser;
          try {
            const response = await graphqlClient.request(ME);
            fullUser = response.me;
          } catch {
            setError(tAuth("cookieBlocked"));
            return;
          }
          await login(fullUser);
          closeRegisterModal();

          if (isClub && fullUser.clubId) {
            router.push(`/${locale}/clubs/${fullUser.clubId}`);
            return;
          }

          // Licence data is loaded after registering (backend takes it via updateUser)
          if (isUmpire) {
            router.push(`/${locale}/profile/edit`);
            return;
          }

          router.push(`/${locale}/opportunities`);
        },
        onError: (err) => handleRegisterError(err),
      },
    );
  };

  const onSubmitStep3Player: SubmitHandler<Step3PlayerData> = submitStep3;
  const onSubmitStep3Club: SubmitHandler<Step3ClubData> = submitStep3;
  const onSubmitStep3Umpire: SubmitHandler<Step3UmpireData> = submitStep3;

  return (
    <div className="rounded-2xl border border-border bg-background p-4 sm:p-6 shadow-xl">
      <StepIndicator currentStep={step} />

      {error && (
        <motion.div
          role="alert"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 text-error bg-error/20 border border-error/40 font-semibold py-2.5 px-4 rounded-lg mb-4"
        >
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="flex-1 text-sm">{error}</p>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label={tAuth("dismissError")}
            className="shrink-0 opacity-70 hover:opacity-100 cursor-pointer"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}

      {step === 1 && (
        <Step1RoleSelect
          t={t}
          selectedRole={selectedRole}
          roleError={roleError}
          onSelectRole={(id) => {
            setSelectedRole(id);
            setRoleError(false);
          }}
          onNext={handleNext}
          onLoginClick={openLoginModal}
        />
      )}

      {step === 2 && (
        <Step2BasicData
          t={t}
          form={step2Form}
          showPassword={showPassword}
          showConfirmPassword={showConfirmPassword}
          onTogglePassword={() => setShowPassword((v) => !v)}
          onToggleConfirmPassword={() => setShowConfirmPassword((v) => !v)}
          onBack={handleBack}
          onNext={handleNext}
          onCheckAvailability={checkAvailability}
        />
      )}

      {step === 3 && (
        <div>
          <h3 className="text-base font-semibold text-foreground mb-4">
            {t("stepRoleDataTitle")}
          </h3>

          {isClub ? (
            <Step3ClubDataForm
              t={t}
              form={step3ClubForm}
              isRegistering={isRegistering || cooldown.active}
              onBack={handleBack}
              onSubmit={onSubmitStep3Club}
            />
          ) : isUmpire ? (
            <Step3UmpireDataForm
              t={t}
              form={step3UmpireForm}
              isRegistering={isRegistering || cooldown.active}
              onBack={handleBack}
              onSubmit={onSubmitStep3Umpire}
            />
          ) : (
            <Step3PlayerDataForm
              t={t}
              tExplore={tExplore}
              form={step3PlayerForm}
              isRegistering={isRegistering || cooldown.active}
              onBack={handleBack}
              onSubmit={onSubmitStep3Player}
            />
          )}
        </div>
      )}
    </div>
  );
};
