"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { graphqlClient } from "@/lib/graphql-client";
import { ME } from "@/graphql/user/queries";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUIStore } from "@/stores/useUIStore";

export function OAuthRedirectPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const { openLoginModal } = useUIStore();
  const { login } = useAuthStore();
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    const handleOAuthRedirect = async () => {
      try {
        // The backend sets its httpOnly session cookie before redirecting
        // here; the browser already carries it, so `me` resolves without
        // any token ever passing through the URL or client-side JS.
        const response = await graphqlClient.request(ME);
        const fullUser = response.me;

        if (ignore) return;

        // Save user in auth store (persisted via Zustand)
        await login(fullUser);

        // Redirect to the main page
        router.replace("/");
      } catch (err) {
        console.error("OAuth redirect error:", err);
        // The only thing that runs here is `me` right after the OAuth
        // callback set the session cookie, so a failure here means the
        // browser rejected that cookie (Safari ITP, private browsing).
        if (!ignore) setError(t("cookieBlocked"));
      }
    };

    handleOAuthRedirect();

    return () => {
      ignore = true;
    };
  }, [login, router, t]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-error font-semibold">{error}</p>
        <button
          onClick={() => {
            router.replace("/");
            openLoginModal();
          }}
          className="text-sm text-foreground/70 underline hover:text-foreground transition-colors"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      {/* Spinner */}
      <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      <p className="text-foreground/70 text-sm">Signing you in…</p>
    </div>
  );
}
