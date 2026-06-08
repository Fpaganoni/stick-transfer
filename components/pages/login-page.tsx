"use client";

import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowUpIcon } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import Image from "next/image";
import { HockeyXTicks } from "@/components/ui/hockey-xtick";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUIStore } from "@/stores/useUIStore";
import { jwtDecode } from "jwt-decode";
import { useUserLogin } from "@/hooks/useUsers";
import { graphqlClient, setAuthToken } from "@/lib/graphql-client";
import { GET_USER_FOR_LOGIN } from "@/graphql/user/queries";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { GraphQLError } from "@/types/graphql-error";
import { Role } from "@/types/enums";

const BACKEND_URL =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000"
    : "http://localhost:4000";

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="white">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="white">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="white">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.722-8.807L2.25 2.25h6.672l4.194 5.58L18.244 2.25zM17.05 19.77h1.833L6.985 4.13H5.029L17.05 19.77z" />
    </svg>
  );
}

export function LoginPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const { openRegisterModal, closeLoginModal } = useUIStore();

  const loginSchema = z.object({
    email: z
      .string()
      .min(1, t("validation.emailRequired"))
      .email(t("validation.emailInvalid"))
      .regex(
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        t("validation.emailValid"),
      ),
    password: z.string().min(6, t("validation.passwordMin")),
  });

  type LoginData = z.infer<typeof loginSchema>;

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuthStore();
  const { mutate: loginUser, isPending } = useUserLogin();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit: SubmitHandler<LoginData> = (data) => {
    loginUser(
      { email: data.email, password: data.password },
      {
        onSuccess: async (responseData) => {
          const token = responseData.login;
          setAuthToken(token);
          const decoded = jwtDecode(token);
          const userId = decoded.sub;
          const response = await graphqlClient.request(GET_USER_FOR_LOGIN, {
            id: userId,
          });
          const fullUser = response.user;
          login(fullUser, token);
          closeLoginModal();
          const localePrefix = locale === "en" ? "" : `/${locale}`;
          router.push(
            fullUser.role === Role.SUPERADMIN
              ? `${localePrefix}/admin`
              : `${localePrefix}/opportunities`
          );
        },
        onError: (err) => {
          const errorMsj =
            (err as GraphQLError)?.response?.errors?.[0]?.message ||
            t("loginFailed");
          setError(errorMsj);
        },
      },
    );
  };

  const socialButtons = [
    {
      label: t("loginWithFacebook"),
      bg: "#1877F2",
      icon: <FacebookIcon />,
      href: `${BACKEND_URL}/auth/facebook`,
    },
    {
      label: t("loginWithGoogle"),
      bg: "#4285F4",
      icon: (
        <Image src="/google-icon.svg" alt="Google" width={20} height={20} />
      ),
      href: `${BACKEND_URL}/auth/google`,
    },
    {
      label: t("loginWithLinkedIn"),
      bg: "#0A66C2",
      icon: <LinkedInIcon />,
      href: `${BACKEND_URL}/auth/linkedin`,
    },
    {
      label: t("loginWithX"),
      bg: "#000000",
      icon: <XIcon />,
      href: `${BACKEND_URL}/auth/twitter`,
    },
  ];

  return (
    <div className="w-full rounded-3xl border border-border bg-background p-8 shadow-xl">
      {/* Header */}
      <div className="flex flex-col items-center mb-7">
        <HockeyXTicks size={48} className="text-primary" />
        <h2 className="text-xl font-semibold text-foreground text-center mt-3 leading-snug">
          {t("loginWelcomeTitle")}
        </h2>
      </div>

      {error && (
        <div className="text-error bg-error/20 font-semibold py-2 px-4 text-xs rounded-lg mb-5">
          <p className="text-error text-sm">{error}</p>
        </div>
      )}

      {/* Two-column body: OAuth | divider | form */}
      <div className="flex flex-col sm:flex-row sm:gap-0 gap-5 sm:items-stretch">
        {/* Left: OAuth buttons */}
        <div className="flex flex-col gap-2.5 sm:flex-1">
          {socialButtons.map((btn) => (
            <motion.button
              key={btn.label}
              type="button"
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.975 }}
              transition={{ duration: 0.15 }}
              onClick={() => {
                window.location.href = btn.href;
              }}
              style={{ backgroundColor: btn.bg }}
              className="w-full h-11 px-4 rounded-xl text-white font-medium text-sm flex items-center gap-3 cursor-pointer transition-opacity hover:opacity-90"
            >
              <span className="shrink-0 w-5 flex items-center justify-center">
                {btn.icon}
              </span>
              <span className="flex-1 text-left">{btn.label}</span>
            </motion.button>
          ))}
        </div>

        {/* OR divider — vertical on desktop, horizontal on mobile */}
        <div className="flex sm:flex-col flex-row items-center gap-2 sm:mx-6 sm:my-0">
          <div className="flex-1 sm:w-px sm:h-auto w-auto h-px bg-border" />
          <span className="text-xs font-medium text-foreground/50 sm:py-1 sm:px-0 px-2">
            {t("or").toUpperCase()}
          </span>
          <div className="flex-1 sm:w-px sm:h-auto w-auto h-px bg-border" />
        </div>

        {/* Right: email/password form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 sm:flex-1"
        >
          {/* Email */}
          <div>
            <Label htmlFor="email" className="mb-1.5 text-sm block">
              {t("email")}
            </Label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50"
                size={16}
              />
              <Input
                {...register("email")}
                id="email"
                type="email"
                placeholder="your@email.com"
                className="pl-9 h-10 text-sm"
              />
            </div>
            {errors.email && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-1 text-error bg-error/20 font-semibold p-1 text-xs mt-1 rounded"
              >
                <ArrowUpIcon size={14} />
                {errors.email.message}
              </motion.p>
            )}
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password" className="mb-1.5 text-sm block">
              {t("password")}
            </Label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50"
                size={16}
              />
              <Input
                {...register("password")}
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pl-9 pr-9 h-10 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground bg-transparent cursor-pointer transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-1 text-error bg-error/20 font-semibold p-1 text-xs mt-1 rounded"
              >
                <ArrowUpIcon size={14} />
                {errors.password.message}
              </motion.p>
            )}
          </div>

          {/* Login button + Sign Up — pushed to bottom on desktop */}
          <div className="flex items-center gap-1 sm:mt-auto mt-1">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={isPending}
              className="flex-1 h-10 px-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover transition-colors cursor-pointer disabled:opacity-50 text-sm"
            >
              {isPending ? t("loggingIn") : t("login")}
            </motion.button>
            <button
              type="button"
              onClick={openRegisterModal}
              className="flex-1 text-sm text-primary hover:underline cursor-pointer whitespace-nowrap shrink-0"
            >
              {t("orSignUp")}
            </button>
          </div>
        </form>
      </div>

      {/* Footer links */}
      <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-1 mt-7 text-xs text-foreground/50">
        <button
          type="button"
          onClick={openRegisterModal}
          className="hover:text-foreground transition-colors cursor-pointer"
        >
          {t("signUp")}
        </button>
        <span>•</span>
        <span className="hover:text-foreground transition-colors cursor-pointer">
          {t("forgotPassword")}
        </span>
        <span>•</span>
        <span className="hover:text-foreground transition-colors cursor-pointer">
          {t("didntReceiveConfirmation")}
        </span>
        <span>•</span>
        <span className="hover:text-foreground transition-colors cursor-pointer">
          {t("didntReceiveUnlock")}
        </span>
      </div>
    </div>
  );
}
