"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { graphqlClient } from "@/lib/graphql-client";
import { GET_USER_FOR_LOGIN } from "@/graphql/user/queries";
import { useAuthStore } from "@/stores/useAuthStore";

export function OAuthRedirectPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [error, setError] = useState("");

  useEffect(() => {
    const handleOAuthRedirect = async () => {
      try {
        // Read token from URL query params: /oauth-redirect?token=<JWT>
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        if (!token) {
          setError("No authentication token received.");
          return;
        }

        // Decode the JWT to extract the user id (sub claim)
        const decoded = jwtDecode<{ sub: string }>(token);
        const userId = decoded.sub;

        if (!userId) {
          setError("Invalid token: missing user identifier.");
          return;
        }

        // Fetch full user data from GraphQL
        const response = await graphqlClient.request(GET_USER_FOR_LOGIN, {
          id: userId,
        });
        const fullUser = response.user;

        // Save user in auth store (persisted via Zustand)
        login(fullUser, token);

        // Redirect to the main page
        router.replace("/");
      } catch (err) {
        console.error("OAuth redirect error:", err);
        setError("Authentication failed. Please try again.");
      }
    };

    handleOAuthRedirect();
  }, [login, router]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-error font-semibold">{error}</p>
        <button
          onClick={() => router.replace("/login")}
          className="text-sm text-foreground/70 underline hover:text-foreground transition-colors"
        >
          Back to Login
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
