import { ClientError } from "graphql-request";

/**
 * True when the backend rejected the session (HTTP 401 or an UNAUTHENTICATED
 * GraphQL error). Network failures and aborted requests are not auth errors.
 */
export function isUnauthenticatedError(error: unknown): boolean {
  if (!(error instanceof ClientError)) return false;

  if (error.response?.status === 401) return true;

  return (error.response?.errors ?? []).some(
    (gqlError) => gqlError.extensions?.code === "UNAUTHENTICATED",
  );
}
