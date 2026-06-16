import { ClientError, GraphQLClient } from "graphql-request";
import { useAuthStore } from "@/stores/useAuthStore";
import { locales } from "@/i18n/request";

const endpoint =
  process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql";

const client = new GraphQLClient(endpoint, {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper function to add authorization token if needed
export const setAuthToken = (token: string | null) => {
  if (token) {
    client.setHeader("Authorization", `Bearer ${token}`);
  } else {
    client.setHeader("Authorization", "");
  }
};

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
  const localePrefix = locales.includes(maybeLocale as (typeof locales)[number])
    ? `/${maybeLocale}`
    : "";

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
