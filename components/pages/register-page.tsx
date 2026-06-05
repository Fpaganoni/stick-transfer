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
} from "lucide-react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserRegister, useUpdateUser } from "@/hooks/useUsers";
import { jwtDecode } from "jwt-decode";
import { graphqlClient, setAuthToken } from "@/lib/graphql-client";
import { GET_USER_FOR_LOGIN } from "@/graphql/user/queries";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuthStore } from "@/stores/useAuthStore";
import { GraphQLError } from "@/types/graphql-error";
import { useTranslations } from "next-intl";
import { useUIStore } from "@/stores/useUIStore";

// ---------------------------------------------------------------------------
// Role card definitions
// ---------------------------------------------------------------------------

type RoleCardId = "player" | "goalkeeper" | "coach" | "clubAdmin" | "scout" | "agent";

interface RoleCard {
  id: RoleCardId;
  icon: string;
  backendRole: string;
}

const ROLE_CARDS: RoleCard[] = [
  { id: "player", icon: "🏃", backendRole: "PLAYER" },
  { id: "goalkeeper", icon: "🥅", backendRole: "PLAYER" },
  { id: "coach", icon: "📋", backendRole: "COACH" },
  { id: "clubAdmin", icon: "🏟️", backendRole: "CLUB_ADMIN" },
  { id: "scout", icon: "🔍", backendRole: "COACH" },
  { id: "agent", icon: "💼", backendRole: "PLAYER" },
];

const HOCKEY_COUNTRIES = [
  "Argentina", "Australia", "Austria", "Belgium", "Canada", "Chile",
  "China", "Egypt", "England", "France", "Germany", "India", "Ireland",
  "Italy", "Japan", "Malaysia", "Netherlands", "New Zealand", "Pakistan",
  "Portugal", "Scotland", "South Africa", "South Korea", "Spain",
  "Switzerland", "United States", "Uruguay", "Wales",
];

const POSITIONS = [
  { value: "goalkeeper", labelKey: "goalkeeper" },
  { value: "defender", labelKey: "defender" },
  { value: "midfielder", labelKey: "midfielder" },
  { value: "attacker", labelKey: "attacker" },
];

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

function StepIndicator({ currentStep }: { currentStep: number }) {
  const t = useTranslations("register");
  const labels = [t("stepRoleTitle"), t("stepBasicTitle"), t("stepRoleDataTitle")];

  return (
    <div className="flex items-center justify-center mb-6 gap-0">
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
              className={`h-px w-8 mx-1 mb-5 flex-shrink-0 transition-colors ${
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
      <ArrowUpIcon size={14} className="flex-shrink-0 mt-px" />
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

type Step3PlayerData = { position: string };
type Step3ClubData = { city: string };

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const RegisterPage = () => {
  const t = useTranslations("register");
  const tValidation = useTranslations("register.validation");
  const tExplore = useTranslations("explore");
  const locale = useLocale();
  const router = useRouter();
  const { login } = useAuthStore();
  const { openLoginModal } = useUIStore();
  const { mutate: registerUser, isPending: isRegistering } = useUserRegister();
  const { mutate: updateUser } = useUpdateUser();

  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<RoleCardId | null>(null);
  const [roleError, setRoleError] = useState(false);
  const [error, setError] = useState("");

  const isClub = selectedRole === "clubAdmin";

  // Step 2 schema
  const step2Schema = z
    .object({
      firstName: z.string().min(2, tValidation("firstNameMin")),
      lastName: z.string().min(2, tValidation("lastNameMin")),
      username: z
        .string()
        .min(6, tValidation("usernameMin"))
        .max(30, tValidation("usernameMax")),
      email: z
        .string()
        .email(tValidation("emailInvalid"))
        .regex(
          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
          tValidation("emailValid"),
        ),
      password: z
        .string()
        .min(6, tValidation("passwordMin"))
        .regex(/[A-Z]/, tValidation("passwordUppercase"))
        .regex(/[0-9]/, tValidation("passwordNumber"))
        .regex(/[@$!%*?&#]/, tValidation("passwordSpecial")),
      confirmPassword: z.string().min(1, tValidation("confirmPasswordRequired")),
      country: z.string().min(1, tValidation("countryRequired")),
      terms: z.boolean().refine((v) => v === true, tValidation("termsRequired")),
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
  });
  const step3ClubSchema = z.object({
    city: z.string().min(1, tValidation("cityRequired")),
  });

  const step3PlayerForm = useForm<Step3PlayerData>({
    resolver: zodResolver(step3PlayerSchema),
  });
  const step3ClubForm = useForm<Step3ClubData>({
    resolver: zodResolver(step3ClubSchema),
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

  // Final submit
  const submitStep3 = async (step3Data: Step3PlayerData | Step3ClubData) => {
    const step2Data = step2Form.getValues();
    const card = ROLE_CARDS.find((r) => r.id === selectedRole)!;
    const fullName = `${step2Data.firstName} ${step2Data.lastName}`;

    registerUser(
      {
        email: step2Data.email,
        name: fullName,
        username: step2Data.username,
        password: step2Data.password,
        role: card.backendRole,
      },
      {
        onSuccess: async (responseData) => {
          const token = responseData.register;
          setAuthToken(token);
          const decoded = jwtDecode(token);
          const userId = decoded.sub!;

          const response = await graphqlClient.request(GET_USER_FOR_LOGIN, {
            id: userId,
          });
          const fullUser = response.user;
          login(fullUser, token);

          // Update extra profile fields from step 3
          const extra: { id: string; country?: string; position?: string; city?: string } = { id: userId };
          if (step2Data.country) extra.country = step2Data.country;
          if ("position" in step3Data && step3Data.position)
            extra.position = step3Data.position;
          if ("city" in step3Data && step3Data.city)
            extra.city = step3Data.city;

          if (Object.keys(extra).length > 1) {
            updateUser(extra);
          }

          router.push(`/${locale}/opportunities`);
        },
        onError: (err) => {
          const msg =
            (err as GraphQLError)?.response?.errors?.[0]?.message ||
            t("registrationFailed");
          setError(msg);
        },
      },
    );
  };

  const onSubmitStep3Player: SubmitHandler<Step3PlayerData> = submitStep3;
  const onSubmitStep3Club: SubmitHandler<Step3ClubData> = submitStep3;

  return (
    <div className="rounded-2xl border border-border bg-background p-6 shadow-xl">
      <StepIndicator currentStep={step} />

      {error && (
        <div className="text-error bg-error/20 font-semibold py-2 px-4 text-xs rounded-lg mb-4">
          <p className="text-error text-sm">{error}</p>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Step 1: Role selection                                               */}
      {/* ------------------------------------------------------------------ */}
      {step === 1 && (
        <div>
          <h3 className="text-base font-semibold text-foreground mb-4">
            {t("stepRoleTitle")}
          </h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {ROLE_CARDS.map((card) => {
              const isSelected = selectedRole === card.id;
              return (
                <button
                  key={card.id}
                  type="button"
                  data-testid={`role-card-${card.id}`}
                  onClick={() => {
                    setSelectedRole(card.id);
                    setRoleError(false);
                  }}
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
            onClick={handleNext}
            className="w-full h-9 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors cursor-pointer flex items-center justify-center gap-1 text-sm"
          >
            {t("next")} <ChevronRight size={16} />
          </motion.button>
          <p className="text-center text-xs text-foreground/50 mt-3">
            {t("alreadyHaveAccount")}{" "}
            <button
              type="button"
              onClick={openLoginModal}
              className="text-primary hover:underline cursor-pointer"
            >
              {t("loginLink")}
            </button>
          </p>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Step 2: Basic data                                                   */}
      {/* ------------------------------------------------------------------ */}
      {step === 2 && (
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
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground" size={16} />
                <Input
                  {...step2Form.register("firstName")}
                  id="firstName"
                  placeholder={t("placeholders.firstName")}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <FieldError message={step2Form.formState.errors.firstName?.message} />
            </div>
            <div>
              <Label htmlFor="lastName" className="mb-1 text-sm">
                {t("lastName")}
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground" size={16} />
                <Input
                  {...step2Form.register("lastName")}
                  id="lastName"
                  placeholder={t("placeholders.lastName")}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <FieldError message={step2Form.formState.errors.lastName?.message} />
            </div>
          </div>

          {/* Username */}
          <div>
            <Label htmlFor="username" className="mb-1 text-sm">
              {t("username")}
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground" size={16} />
              <Input
                {...step2Form.register("username")}
                id="username"
                placeholder={t("placeholders.username")}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <FieldError message={step2Form.formState.errors.username?.message} />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="reg-email" className="mb-1 text-sm">
              {t("email")}
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground" size={16} />
              <Input
                {...step2Form.register("email")}
                id="reg-email"
                type="email"
                placeholder={t("placeholders.email")}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <FieldError message={step2Form.formState.errors.email?.message} />
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="reg-password" className="mb-1 text-sm">
              {t("password")}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground" size={16} />
              <Input
                {...step2Form.register("password")}
                id="reg-password"
                type={showPassword ? "text" : "password"}
                placeholder={t("placeholders.password")}
                className="pl-9 pr-9 h-9 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <FieldError message={step2Form.formState.errors.password?.message} />
          </div>

          {/* Confirm password */}
          <div>
            <Label htmlFor="confirmPassword" className="mb-1 text-sm">
              {t("confirmPassword")}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground" size={16} />
              <Input
                {...step2Form.register("confirmPassword")}
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder={t("placeholders.password")}
                className="pl-9 pr-9 h-9 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <FieldError message={step2Form.formState.errors.confirmPassword?.message} />
          </div>

          {/* Country */}
          <div>
            <Label htmlFor="country" className="mb-1 text-sm">
              {t("country")}
            </Label>
            <select
              {...step2Form.register("country")}
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
            <FieldError message={step2Form.formState.errors.country?.message} />
          </div>

          {/* Terms */}
          <div className="flex items-start gap-2 pt-1">
            <input
              {...step2Form.register("terms")}
              id="terms"
              type="checkbox"
              className="mt-0.5 accent-primary cursor-pointer"
            />
            <Label htmlFor="terms" className="text-xs text-foreground/70 cursor-pointer leading-relaxed">
              {t("termsAndConditions")}
            </Label>
          </div>
          {step2Form.formState.errors.terms && (
            <p className="text-error text-xs">
              {step2Form.formState.errors.terms.message}
            </p>
          )}

          {/* Navigation */}
          <div className="flex gap-2 pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={handleBack}
              className="h-9 px-4 border border-border rounded-lg text-sm font-medium hover:bg-border/30 transition-colors cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft size={16} /> {t("back")}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={handleNext}
              className="flex-1 h-9 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors cursor-pointer flex items-center justify-center gap-1 text-sm"
            >
              {t("next")} <ChevronRight size={16} />
            </motion.button>
          </div>
        </form>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Step 3: Role-specific data                                           */}
      {/* ------------------------------------------------------------------ */}
      {step === 3 && (
        <div>
          <h3 className="text-base font-semibold text-foreground mb-4">
            {t("stepRoleDataTitle")}
          </h3>

          {isClub ? (
            <form
              onSubmit={step3ClubForm.handleSubmit(onSubmitStep3Club)}
              className="space-y-3"
            >
              {/* City */}
              <div>
                <Label htmlFor="city" className="mb-1 text-sm">
                  {t("city")}
                </Label>
                <Input
                  {...step3ClubForm.register("city")}
                  id="city"
                  placeholder={t("placeholders.city")}
                  className="h-9 text-sm"
                />
                <FieldError message={step3ClubForm.formState.errors.city?.message} />
              </div>

              <div className="flex gap-2 pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={handleBack}
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
          ) : (
            <form
              onSubmit={step3PlayerForm.handleSubmit(onSubmitStep3Player)}
              className="space-y-3"
            >
              {/* Preferred position */}
              <div>
                <Label htmlFor="position" className="mb-1 text-sm">
                  {t("preferredPosition")}
                </Label>
                <select
                  {...step3PlayerForm.register("position")}
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
                <FieldError message={step3PlayerForm.formState.errors.position?.message} />
              </div>

              <div className="flex gap-2 pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={handleBack}
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
          )}
        </div>
      )}
    </div>
  );
};
