"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { graphqlClient, setAuthToken } from "@/lib/graphql-client";
import { ME } from "@/graphql/user/queries";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUIStore } from "@/stores/useUIStore";

export function OAuthRedirectPage() {
  const router = useRouter();
  const { openLoginModal } = useUIStore();
  const { login } = useAuthStore();
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    const handleOAuthRedirect = async () => {
      try {
        // Read token from URL query params: /oauth-redirect?token=<JWT>
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        if (!token) {
          if (!ignore) setError("No authentication token received.");
          return;
        }

        // Attach the token before requesting `me` — it's resolved
        // server-side from the JWT, no id needed or trusted from the client.
        setAuthToken(token);
        const response = await graphqlClient.request(ME);
        const fullUser = response.me;

        if (ignore) return;

        // Save user in auth store (persisted via Zustand)
        await login(fullUser, token);

        // Redirect to the main page
        router.replace("/");
      } catch (err) {
        console.error("OAuth redirect error:", err);
        if (!ignore) setError("Authentication failed. Please try again.");
      }
    };

    handleOAuthRedirect();

    return () => {
      ignore = true;
    };
  }, [login, router]);

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
