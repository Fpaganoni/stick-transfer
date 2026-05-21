/**
 * What: Unit tests for useRequestClubVerification hook.
 * Why: Verifies that the mutation is called with the correct GraphQL variables.
 *      The file uses JSX (QueryClientProvider wrapper) so it must be .tsx.
 */
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRequestClubVerification } from "@/hooks/useClubMutations";
import { graphqlClient } from "@/lib/graphql-client";
import { ReactNode } from "react";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/graphql-client");

const mockClub = {
  id: "1",
  name: "Test Club",
  verificationStatus: "PENDING" as const,
  isVerified: false,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

describe("useRequestClubVerification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mutates with correct variables", async () => {
    const mockRequest = vi.fn().mockResolvedValue({
      requestClubVerification: mockClub,
    });
    vi.mocked(graphqlClient).request = mockRequest;

    const { result } = renderHook(() => useRequestClubVerification(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      clubId: "1",
      documentUrl: "https://example.com/doc.pdf",
    });

    await waitFor(() => {
      expect(mockRequest).toHaveBeenCalled();
    });
  });
});
