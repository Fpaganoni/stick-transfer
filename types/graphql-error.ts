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
