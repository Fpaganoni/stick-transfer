/**
 * What: Tests for useExploreUsers variable mapping.
 * Why: The backend hides umpires from explore unless `role: "UMPIRE"` or an
 *      umpire filter is sent, and rejects invalid enum values. The hook must
 *      forward the umpire filters and drop empty ones.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useExploreUsers } from "@/hooks/useExplore";

const mockRequest = vi.fn();
vi.mock("@/lib/graphql-client", () => ({
  graphqlClient: { request: (...args: unknown[]) => mockRequest(...args) },
}));

function wrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

describe("useExploreUsers", () => {
  beforeEach(() => {
    mockRequest.mockReset();
    mockRequest.mockResolvedValue({ exploreUsers: [] });
  });

  it("forwards role and the umpire filters", async () => {
    const { result } = renderHook(
      () =>
        useExploreUsers({
          role: "UMPIRE",
          licenseLevel: "INTERNACIONAL",
          modality: "OUTDOOR",
          umpireCategory: "FEMENINO",
          limit: 20,
          offset: 40,
        }),
      { wrapper: wrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const variables = mockRequest.mock.calls[0][1];
    expect(variables).toMatchObject({
      role: "UMPIRE",
      licenseLevel: "INTERNACIONAL",
      modality: "OUTDOOR",
      umpireCategory: "FEMENINO",
      limit: 20,
      offset: 40,
    });
  });

  it("omits empty umpire filters instead of sending empty strings", async () => {
    const { result } = renderHook(
      () => useExploreUsers({ role: "UMPIRE", licenseLevel: "", modality: "", umpireCategory: "" }),
      { wrapper: wrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const variables = mockRequest.mock.calls[0][1];
    expect(variables.licenseLevel).toBeUndefined();
    expect(variables.modality).toBeUndefined();
    expect(variables.umpireCategory).toBeUndefined();
  });

  it("keeps the previous results visible while a bigger page loads", async () => {
    mockRequest.mockResolvedValueOnce({ exploreUsers: [{ id: "a" }] });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );
    const { result, rerender } = renderHook(({ limit }) => useExploreUsers({ limit }), {
      wrapper: Wrapper,
      initialProps: { limit: 50 },
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    mockRequest.mockReturnValueOnce(new Promise(() => {})); // never resolves
    rerender({ limit: 100 });

    await waitFor(() => expect(result.current.isPlaceholderData).toBe(true));
    expect(result.current.data?.exploreUsers).toEqual([{ id: "a" }]);
  });

  it("keeps cache entries separate per umpire filter", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );
    const { result, rerender } = renderHook(
      ({ level }) => useExploreUsers({ role: "UMPIRE", licenseLevel: level }),
      { wrapper: Wrapper, initialProps: { level: "NACIONAL" } },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    rerender({ level: "REGIONAL" });
    await waitFor(() => expect(mockRequest).toHaveBeenCalledTimes(2));
    expect(mockRequest.mock.calls[1][1].licenseLevel).toBe("REGIONAL");
  });
});
