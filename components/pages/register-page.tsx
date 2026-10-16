"use client";

import { useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
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
import { dateOfBirthSchema } from "@/lib/date-of-birth";
import { isCountryCode } from "@/lib/countries";
import { useCooldown } from "@/hooks/useCooldown";
import { useTranslations } from "next-intl";
import { useUIStore } from "@/stores/useUIStore";
import { Step3ClubDataForm, type Step3ClubData } from "./register-club-steps";
import {
  LegalLink,
  ROLE_CARDS,
  Step1RoleSelect,
  Step2BasicData,
  StepIndicator,
  type RoleCardId,
  type Step2Data,
} from "./register-basic-steps";
import {
  Step3CoachDataForm,
  Step3PlayerDataForm,
  Step3UmpireDataForm,
  type Step3CoachData,
  type Step3PlayerData,
  type Step3UmpireData,
} from "./register-role-steps";

// Backend field name (VALIDATION_ERROR fields[].field) -> step 2 input that shows it.
// A club is named by `clubName`; every other role by first and last name.
const SHARED_STEP2_SERVER_FIELDS = {
  email: "email",
  password: "password",
  username: "username",
  country: "country",
} as const;

const STEP2_SERVER_FIELDS: Record<
  "club" | "person",
  Partial<Record<string, keyof Step2Data>>
> = {
  person: { ...SHARED_STEP2_SERVER_FIELDS, name: "firstName" },
  club: { ...SHARED_STEP2_SERVER_FIELDS, name: "clubName", clubName: "clubName" },
};

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
  const isCoach = selectedRole === "coach";
  const isPlayer = selectedRole === "player";

  // Step 2 schema
  const step2Schema = z
    .object({
      // The backend stores the full name (max 100) as "first last".
      // A club is named instead: the person in charge is asked on step 3
      firstName: isClub
        ? z.string()
        : z
            .string()
            .trim()
            .min(2, tValidation("firstNameMin"))
            .max(49, tValidation("nameTooLong")),
      lastName: isClub
        ? z.string()
        : z
            .string()
            .trim()
            .min(2, tValidation("lastNameMin"))
            .max(50, tValidation("nameTooLong")),
      clubName: isClub
        ? z
            .string()
            .trim()
            .min(2, tValidation("clubNameRequired"))
            .max(100, tValidation("nameTooLong"))
        : z.string(),
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
      country: z
        .string()
        .min(1, tValidation("countryRequired"))
        .refine(isCountryCode, tValidation("countryInvalid")),
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
    defaultValues: { terms: false, firstName: "", lastName: "", clubName: "" },
  });

  // Step 3 schemas
  const dateOfBirth = dateOfBirthSchema((key) => tValidation(key));
  const step3PlayerSchema = z.object({
    position: z.string().min(1, tValidation("positionRequired")),
    dateOfBirth,
  });
  const step3CoachSchema = z.object({ dateOfBirth });
  // Private data of the person in charge. Same rule as the backend (checkManagerName):
  // required, up to 100 chars each; it has no minimum length beyond "not empty".
  const step3ClubSchema = z.object({
    city: z.string().trim().min(1, tValidation("cityRequired")),
    managedByFirstName: z
      .string()
      .trim()
      .min(1, tValidation("fieldRequired"))
      .max(100, tValidation("nameTooLong")),
    managedByLastName: z
      .string()
      .trim()
      .min(1, tValidation("fieldRequired"))
      .max(100, tValidation("nameTooLong")),
  });

  const step3UmpireSchema = z.object({
    city: z.string().min(1, tValidation("cityRequired")),
    dateOfBirth,
  });

  const step3PlayerForm = useForm<Step3PlayerData>({
    resolver: zodResolver(step3PlayerSchema),
  });
  const step3CoachForm = useForm<Step3CoachData>({
    resolver: zodResolver(step3CoachSchema),
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
    // Player, coach and umpire each own a separate step 3 form with a birth date
    const setDateOfBirthError = (message: string) => {
      if (isPlayer) step3PlayerForm.setError("dateOfBirth", { ...opts, message });
      if (isCoach) step3CoachForm.setError("dateOfBirth", { ...opts, message });
      if (isUmpire) step3UmpireForm.setError("dateOfBirth", { ...opts, message });
    };
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
      case "CLUB_NAME_TAKEN":
        step2Form.setError("clubName", {
          ...opts,
          message: tValidation("clubNameTaken"),
        });
        focusStep2("clubName");
        return;
      case "VALIDATION_ERROR": {
        let firstStep2Field: keyof Step2Data | null = null;
        let unplaced = false;

        for (const { field, code } of parsed.fields) {
          const message = serverMessage(code);
          const step2Field = STEP2_SERVER_FIELDS[isClub ? "club" : "person"][
            field as string
          ];

          if (message && step2Field) {
            step2Form.setError(step2Field, { ...opts, message });
            firstStep2Field ??= step2Field;
          } else if (message && field === "managedByFirstName" && isClub) {
            step3ClubForm.setError("managedByFirstName", { ...opts, message });
          } else if (message && field === "managedByLastName" && isClub) {
            step3ClubForm.setError("managedByLastName", { ...opts, message });
          } else if (message && field === "city" && isClub) {
            step3ClubForm.setError("city", { ...opts, message });
          } else if (message && field === "city" && isUmpire) {
            step3UmpireForm.setError("city", { ...opts, message });
          } else if (message && field === "position" && isPlayer) {
            step3PlayerForm.setError("position", { ...opts, message });
          } else if (message && field === "dateOfBirth" && !isClub) {
            setDateOfBirthError(message);
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
    step3Data: Step3PlayerData | Step3CoachData | Step3ClubData | Step3UmpireData,
  ) => {
    const step2Data = step2Form.getValues();
    const card = ROLE_CARDS.find((r) => r.id === selectedRole)!;
    // A club account is named after the club; the backend ignores `name` for a CLUB
    // but still needs a non-empty one.
    const accountName = isClub
      ? step2Data.clubName.trim()
      : `${step2Data.firstName.trim()} ${step2Data.lastName.trim()}`;
    // The backend rejects dateOfBirth: "" (DATE_OF_BIRTH_INVALID): omit it instead
    const dateOfBirth =
      "dateOfBirth" in step3Data ? step3Data.dateOfBirth : undefined;

    setError("");
    registerUser(
      {
        email: step2Data.email.trim(),
        name: accountName,
        username: step2Data.username.trim() || undefined,
        password: step2Data.password,
        role: card.backendRole,
        country: step2Data.country,
        // Never dateOfBirth or position here: the backend rejects them for a CLUB
        ...(isClub && "managedByFirstName" in step3Data
          ? {
              clubName: accountName,
              city: step3Data.city.trim(),
              managedByFirstName: step3Data.managedByFirstName.trim(),
              managedByLastName: step3Data.managedByLastName.trim(),
            }
          : {}),
        ...(isUmpire && "city" in step3Data && !("managedByFirstName" in step3Data)
          ? { city: step3Data.city }
          : {}),
        // Position is only stored for PLAYER (POSITION_INVALID otherwise)
        ...(isPlayer && "position" in step3Data
          ? { position: step3Data.position }
          : {}),
        ...(dateOfBirth ? { dateOfBirth } : {}),
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

          // A new club still has no crest or description: it completes them from
          // the editor instead of landing on an empty public page.
          if (isClub) {
            router.push(`/${locale}/profile/edit`);
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
  const onSubmitStep3Coach: SubmitHandler<Step3CoachData> = submitStep3;
  const onSubmitStep3Club: SubmitHandler<Step3ClubData> = submitStep3;
  const onSubmitStep3Umpire: SubmitHandler<Step3UmpireData> = submitStep3;

  const termsLabel = t.rich("termsAndConditions", {
    terms: (chunks) => (
      <LegalLink href={`/${locale}/legal/terms`}>{chunks}</LegalLink>
    ),
    privacy: (chunks) => (
      <LegalLink href={`/${locale}/legal/privacy`}>{chunks}</LegalLink>
    ),
  });

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
          termsLabel={termsLabel}
          form={step2Form}
          isClub={isClub}
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
          ) : isCoach ? (
            <Step3CoachDataForm
              t={t}
              form={step3CoachForm}
              isRegistering={isRegistering || cooldown.active}
              onBack={handleBack}
              onSubmit={onSubmitStep3Coach}
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
