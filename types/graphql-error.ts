/**
 * GraphQL Error Types
 * Based on graphql-request error structure
 */

export interface GraphQLErrorResponse {
  message: string;
  locations?: Array<{
    line: number;
    column: number;
  }>;
  path?: string[];
  extensions?: {
    code?: string;
    [key: string]: unknown;
  };
}

export interface GraphQLError extends Error {
  response?: {
    errors?: GraphQLErrorResponse[];
    data?: unknown;
    status?: number;
  };
  request?: {
    query?: string;
    variables?: unknown;
  };
}

/**
 * Type guard to check if an error is a GraphQL error
 */
export function isGraphQLError(error: unknown): error is GraphQLError {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as Record<string, unknown>).response === "object"
  );
}

/**
 * Safely extract error message from GraphQL error
 */
export function getGraphQLErrorMessage(error: unknown): string {
  if (isGraphQLError(error)) {
    return (
      error.response?.errors?.[0]?.message || error.message || "Unknown error"
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred";
}
