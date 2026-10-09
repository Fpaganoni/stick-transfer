import type { GraphQLError } from "@/types/graphql-error";

/**
 * The backend always answers GraphQL errors with HTTP 200 and puts a stable
 * machine code in `extensions.code`. Never branch on `message` text.
 */
export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "EMAIL_TAKEN"
  | "USERNAME_TAKEN"
  | "INVALID_CREDENTIALS"
  | "RATE_LIMITED"
  | "UNAUTHENTICATED"
  | "INTERNAL_ERROR"
  | "GRAPHQL_VALIDATION_FAILED"
  | "NETWORK_ERROR"
  | "UNKNOWN";

export interface ApiFieldError {
  field: string;
  code: string;
}

export interface ParsedApiError {
  code: ApiErrorCode;
  /** Only filled for VALIDATION_ERROR (extensions.fields). */
  fields: ApiFieldError[];
  /** Field the error points at (EMAIL_TAKEN -> "email"). */
  field?: string;
}

const KNOWN_CODES: ReadonlySet<string> = new Set<ApiErrorCode>([
  "VALIDATION_ERROR",
  "EMAIL_TAKEN",
  "USERNAME_TAKEN",
  "INVALID_CREDENTIALS",
  "RATE_LIMITED",
  "UNAUTHENTICATED",
  "INTERNAL_ERROR",
  "GRAPHQL_VALIDATION_FAILED",
]);

export function parseApiError(err: unknown): ParsedApiError {
  const e = err as GraphQLError | undefined;

  // No HTTP response at all: backend down, offline, CORS, etc.
  if (!e?.response) return { code: "NETWORK_ERROR", fields: [] };

  const extensions = e.response.errors?.[0]?.extensions as
    | {
        code?: string;
        field?: string;
        fields?: Array<{ field?: string; code?: string }>;
      }
    | undefined;

  const rawCode = extensions?.code;
  const code: ApiErrorCode =
    rawCode && KNOWN_CODES.has(rawCode) ? (rawCode as ApiErrorCode) : "UNKNOWN";

  const fields: ApiFieldError[] = (extensions?.fields ?? [])
    .filter((f) => f?.field && f?.code)
    .map((f) => ({ field: f.field as string, code: f.code as string }));

  return { code, fields, field: extensions?.field };
}

// Keys under the `auth` namespace in messages/{en,es,fr}.json.
export type LoginErrorKey =
  | "invalidCredentials"
  | "networkError"
  | "tooManyAttempts"
  | "serverError";

/** Login errors never reveal whether the email or the password failed. */
export function getLoginErrorKey(err: unknown): LoginErrorKey {
  switch (parseApiError(err).code) {
    case "NETWORK_ERROR":
      return "networkError";
    case "RATE_LIMITED":
      return "tooManyAttempts";
    case "INVALID_CREDENTIALS":
      return "invalidCredentials";
    default:
      return "serverError";
  }
}

/**
 * VALIDATION_ERROR `fields[].code` -> key under `register.validation`.
 * Unknown codes are not in the map; callers fall back to a generic message.
 */
export const FIELD_ERROR_MESSAGE_KEY: Record<string, string> = {
  EMAIL_REQUIRED: "fieldRequired",
  EMAIL_INVALID: "emailValid",
  EMAIL_TOO_LONG: "emailTooLong",
  PASSWORD_REQUIRED: "fieldRequired",
  PASSWORD_TOO_SHORT: "passwordMin",
  PASSWORD_TOO_LONG: "passwordMax",
  PASSWORD_NEEDS_LOWERCASE: "passwordLowercase",
  PASSWORD_NEEDS_UPPERCASE: "passwordUppercase",
  PASSWORD_NEEDS_NUMBER: "passwordNumber",
  PASSWORD_NEEDS_SYMBOL: "passwordSpecial",
  PASSWORD_TOO_COMMON: "passwordTooCommon",
  USERNAME_INVALID: "usernameInvalid",
  USERNAME_RESERVED: "usernameReserved",
  NAME_REQUIRED: "fieldRequired",
  NAME_TOO_LONG: "nameTooLong",
  ROLE_INVALID: "roleInvalid",
  FIELD_REQUIRED: "fieldRequired",
  DATE_OF_BIRTH_INVALID: "dobInvalid",
  DATE_OF_BIRTH_TOO_YOUNG: "dobTooYoung",
  DATE_OF_BIRTH_TOO_OLD: "dobTooOld",
  POSITION_INVALID: "positionInvalid",
};

/** Seconds the UI keeps the submit button disabled after RATE_LIMITED. */
export const RATE_LIMIT_COOLDOWN_SECONDS = 60;

const encoder = typeof TextEncoder !== "undefined" ? new TextEncoder() : null;

/** Backend limits the password in bytes (72), not characters: ñ/emoji > 1. */
export function byteLength(value: string): number {
  return encoder ? encoder.encode(value).length : value.length;
}
