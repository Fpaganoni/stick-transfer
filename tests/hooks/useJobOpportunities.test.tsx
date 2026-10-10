/**
 * What: Unit tests for useJobOpportunities initialData handling and for
 *       useOpenOpportunityDetail.
 * Why: /opportunities is server-rendered without the session cookie, so the
 *      initialData it passes carries isSavedByCurrentUser=false for everyone.
 *      With a session the hook must refetch on mount instead of trusting it.
 *      The Applications tab only has a light copy of each opportunity, so the
 *      detail opens with it at once and swaps in the full one when it arrives.
 */
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useJobOpportunities, useOpenOpportunityDetail } from "@/hooks/useJobOpportunities";
import { useOpportunitiesStore } from "@/stores/useOpportunitiesStore";
import { toast } from "sonner";
import { graphqlClient } from "@/lib/graphql-client";
import { useAuthStore } from "@/stores/useAuthStore";
import type { JobOpportunity } from "@/types/models/job-opportunity";
import { mockUser } from "../test-utils";

vi.mock("@/lib/graphql-client");
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

const serverRenderedJob = {
  id: "job-1",
  title: "Server rendered",
  isSavedByCurrentUser: false,
} as unknown as JobOpportunity;

const freshJob = { ...serverRenderedJob, isSavedByCurrentUser: true } as JobOpportunity;

function createWrapper() {
  // Same staleTime as the app's QueryProvider, otherwise initialData is never refetched.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 60 * 1000 } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useJobOpportunities initialData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, isLoggedIn: false });
  });

  it("refetches on mount when there is a session, replacing the cookie-less server data", async () => {
    useAuthStore.setState({ user: mockUser, isLoggedIn: true });
    const request = vi.fn().mockResolvedValue({ jobOpportunities: [freshJob] });
    vi.mocked(graphqlClient).request = request;

    const { result } = renderHook(
      () => useJobOpportunities(undefined, { jobOpportunities: [serverRenderedJob] }),
      { wrapper: createWrapper() },
    );

    await waitFor(() =>
      expect(result.current.data?.jobOpportunities[0].isSavedByCurrentUser).toBe(true),
    );
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("keeps the server data without a session", async () => {
    const request = vi.fn().mockResolvedValue({ jobOpportunities: [freshJob] });
    vi.mocked(graphqlClient).request = request;

    const { result } = renderHook(
      () => useJobOpportunities(undefined, { jobOpportunities: [serverRenderedJob] }),
      { wrapper: createWrapper() },
    );

    expect(result.current.data?.jobOpportunities[0].isSavedByCurrentUser).toBe(false);
    expect(request).not.toHaveBeenCalled();
  });
});

describe("useOpenOpportunityDetail", () => {
  const preview = {
    id: "job-9",
    title: "From my applications",
    city: "Madrid",
    country: "ES",
    salary: 0,
    currency: "EUR",
    level: "PROFESSIONAL" as const,
    status: "open" as const,
    positionType: "PLAYER",
    club: { id: "c1", name: "HC Madrid" },
  };
  const full = {
    ...preview,
    description: "Full description",
    benefits: [],
    createdAt: "2026-10-01T00:00:00Z",
    isSavedByCurrentUser: true,
  } as JobOpportunity;

  beforeEach(() => {
    vi.clearAllMocks();
    useOpportunitiesStore.setState({ selectedOpportunity: null, isModalOpen: false });
  });

  it("opens the modal right away with the preview, then swaps in the full opportunity", async () => {
    let resolve: (value: unknown) => void = () => {};
    vi.mocked(graphqlClient).request = vi.fn(
      () => new Promise((r) => (resolve = r)),
    ) as never;
    const { result } = renderHook(() => useOpenOpportunityDetail(), {
      wrapper: createWrapper(),
    });

    act(() => result.current(preview));

    expect(useOpportunitiesStore.getState()).toMatchObject({
      isModalOpen: true,
      selectedOpportunity: preview,
    });

    await act(async () => resolve({ jobOpportunity: full }));

    await waitFor(() =>
      expect(useOpportunitiesStore.getState().selectedOpportunity).toEqual(full),
    );
  });

  it("does not overwrite another opportunity opened meanwhile", async () => {
    let resolve: (value: unknown) => void = () => {};
    vi.mocked(graphqlClient).request = vi.fn(
      () => new Promise((r) => (resolve = r)),
    ) as never;
    const { result } = renderHook(() => useOpenOpportunityDetail(), {
      wrapper: createWrapper(),
    });

    act(() => result.current(preview));
    const other = { ...full, id: "job-other" };
    act(() => useOpportunitiesStore.setState({ selectedOpportunity: other }));
    await act(async () => resolve({ jobOpportunity: full }));

    expect(useOpportunitiesStore.getState().selectedOpportunity).toEqual(other);
  });

  it("closes the modal when the opportunity no longer exists", async () => {
    vi.mocked(graphqlClient).request = vi.fn().mockResolvedValue({ jobOpportunity: null });
    const { result } = renderHook(() => useOpenOpportunityDetail(), {
      wrapper: createWrapper(),
    });

    act(() => result.current(preview));

    await waitFor(() => expect(useOpportunitiesStore.getState().isModalOpen).toBe(false));
    expect(toast.error).toHaveBeenCalledWith("opportunityNotFound");
  });
});
