"use client";

import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowUpIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/useAuthStore";
import { jwtDecode } from "jwt-decode";
import { useUserLogin } from "@/hooks/useUsers";
import { graphqlClient, setAuthToken } from "@/lib/graphql-client";
import { GET_USER_FOR_LOGIN } from "@/graphql/user/queries";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { GraphQLError } from "@/types/graphql-error";

export function LoginPage() {
  const t = useTranslations("auth");

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
          router.push("/");
        },
        onError: (error) => {
          const errorMsj =
            (error as GraphQLError)?.response?.errors?.[0]?.message ||
            t("loginFailed");
          setError(errorMsj);
        },
      },
    );
  };

  return (
    <>
      {/* Login Card */}
      <div className="w-full rounded-3xl border border-border bg-background p-6 shadow-xl">
        <h2 className="text-xl font-medium text-foreground mb-4">
          {t("loginTitle")}
        </h2>

        {error && (
          <div className="text-error bg-error/20 font-semibold py-2 px-4 text-xs mt-2 rounded-lg mb-5">
            <p className="text-error text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Email Input */}
          <div className="mb-4">
            <Label htmlFor="email" className="mb-2">
              {t("email")}
            </Label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground"
                size={18}
              />
              <Input
                {...register("email", { required: true })}
                id="email"
                type="email"
                placeholder="your@email.com"
                className="pl-10"
              />
            </div>
            {errors.email && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex gap-1 text-error bg-error/20 font-semibold p-1 text-xs mt-2"
              >
                <ArrowUpIcon size={16} />
                {errors.email.message}
              </motion.p>
            )}
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <Label htmlFor="password" className="mb-2">
              {t("password")}
            </Label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground"
                size={18}
              />
              <Input
                {...register("password", { required: true })}
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground bg-input cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex gap-1 text-error bg-error/20 font-semibold p-1 text-xs mt-2"
              >
                <ArrowUpIcon size={16} />
                {errors.password.message}
              </motion.p>
            )}
          </div>

          {/* Login Button */}
          <div className="space-y-2 mb-4">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              type="submit"
              disabled={isPending}
              className="w-full h-(--input-button-height) px-4 py-2 mt-2 bg-primary text-white-black font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 cursor-pointer disabled:opacity-50"
            >
              {isPending ? t("loggingIn") : t("login")}
            </motion.button>
          </div>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-border"></div>
          <span className="text-md text-foreground/85">{t("or")}</span>
          <div className="flex-1 h-px bg-border"></div>
        </div>

        {/* Social Login */}
        <div className="space-y-2">
          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            onClick={() => {
              const backendUrl =
                process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
              window.location.href = `${backendUrl}/auth/google`;
            }}
            className="w-full h-(var(--input-button-height)) px-4 py-2 border-2 border-border-strong rounded-lg text-foreground hover:text-white-black hover:bg-foreground transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Image
              src={"/google-icon.svg"}
              alt="Google Icon"
              width={26}
              height={26}
            />
            {t("continueWithGoogle")}
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="w-full h-(--input-button-height) px-4 py-2 border-2 border-border-strong rounded-lg text-foreground hover:text-white-black hover:bg-foreground transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Image
              src={"/apple-icon.svg"}
              className="bg-bg-apple rounded-full"
              alt="Apple"
              width={26}
              height={26}
            />
            {t("continueWithApple")}
          </motion.button>
        </div>

        {/* Footer */}
        {/* <p className="text-xs text-foreground text-center mt-4">
          {t("dontHaveAccount")}{" "}
          <span className="text-foreground-muted hover:text-foreground cursor-pointer transition-colors">
            {t("signUp")}
          </span>
        </p> */}
      </div>
    </>
  );
}
