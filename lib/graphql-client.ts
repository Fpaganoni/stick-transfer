import { ClientError, GraphQLClient } from "graphql-request";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/useAuthStore";
import { locales } from "@/i18n/request";

// This module runs outside React, so it can't use the useTranslations hook.
// Keep this in sync with auth.sessionExpired in messages/{en,es,fr}.json.
const SESSION_EXPIRED_MESSAGE: Record<string, string> = {
  en: "Your session has expired. Please log in again.",
  es: "Tu sesión expiró. Iniciá sesión de nuevo.",
  fr: "Votre session a expiré. Veuillez vous reconnecter.",
};

const endpoint =
  process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql";

// credentials: "include" sends the backend's httpOnly auth cookie on every
// request; the JWT never lives in JS-accessible storage or headers.
const client = new GraphQLClient(endpoint, {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
});

function isUnauthenticatedError(error: unknown): boolean {
  if (!(error instanceof ClientError)) return false;

  if (error.response?.status === 401) return true;

  return (error.response?.errors ?? []).some(
    (gqlError) => gqlError.extensions?.code === "UNAUTHENTICATED",
  );
}

function handleUnauthenticated() {
  useAuthStore.getState().logout();

  if (typeof window === "undefined") return;

  const [, maybeLocale] = window.location.pathname.split("/");
  const isKnownLocale = locales.includes(maybeLocale as (typeof locales)[number]);
  const locale = isKnownLocale ? maybeLocale : "en";
  const localePrefix = isKnownLocale ? `/${maybeLocale}` : "";

  toast.error(SESSION_EXPIRED_MESSAGE[locale] ?? SESSION_EXPIRED_MESSAGE.en);
  window.location.href = `${localePrefix}/`;
}

// Wraps graphql-request so any UNAUTHENTICATED/401 response logs the user
// out and redirects to /login instead of failing silently forever.
export const graphqlClient = {
  request: (async (...args: Parameters<GraphQLClient["request"]>) => {
    try {
      return await client.request(
        ...(args as Parameters<typeof client.request>),
      );
    } catch (error) {
      if (isUnauthenticatedError(error)) {
        handleUnauthenticated();
      }
      throw error;
    }
  }) as GraphQLClient["request"],
};
