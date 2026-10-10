/**
 * What: Tests for useApplyForJob and useUserApplications.
 * Why: The mutation used to print the user id and the CV url to the browser
 *      console. Personal data must never be logged, and the request itself must
 *      keep sending the applicant and the CV. The applied state now comes from
 *      the ["userApplications", userId] cache only, so a successful apply must
 *      write to it, and a withdrawn application must not count as applied.
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { useApplyForJob, useUserApplications } from "@/hooks/useJobApplications";
import { graphqlClient } from "@/lib/graphql-client";
import { useAuthStore } from "@/stores/useAuthStore";
import { APPLY_FOR_JOB } from "@/graphql";
import { mockUser } from "../test-utils";

vi.mock("@/lib/graphql-client");
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function wrapperFor(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function createWrapper() {
  return wrapperFor(
    new QueryClient({ defaultOptions: { mutations: { retry: false } } }),
  );
}

describe("useUserApplications", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: mockUser, isLoggedIn: true });
  });

  afterEach(() => {
    useAuthStore.setState({ user: null, isLoggedIn: false });
  });

  it("does not count withdrawn applications as applied", async () => {
    vi.mocked(graphqlClient).request = vi.fn().mockResolvedValue({
      userApplications: [
        { id: "a1", jobOpportunityId: "job-active", status: "PENDING", appliedAt: "x" },
        { id: "a2", jobOpportunityId: "job-withdrawn", status: "WITHDRAWN", appliedAt: "x" },
      ],
    });
    const { result } = renderHook(() => useUserApplications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.applications).toHaveLength(2));

    expect(result.current.hasAppliedTo("job-active")).toBe(true);
    expect(result.current.hasAppliedTo("job-withdrawn")).toBe(false);
  });
});

describe("useApplyForJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: mockUser, isLoggedIn: true });
    vi.mocked(graphqlClient).request = vi
      .fn()
      .mockResolvedValue({ applyForJob: { id: "app-1", status: "PENDING" } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null, isLoggedIn: false });
  });

  it("sends the applicant and the CV to the API", async () => {
    const { result } = renderHook(() => useApplyForJob(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync({
        jobOpportunityId: "job-1",
        resumeUrl: "https://example.com/cv.pdf",
      });
    });

    expect(graphqlClient.request).toHaveBeenCalledWith(APPLY_FOR_JOB, {
      jobOpportunityId: "job-1",
      userId: mockUser.id,
      coverLetter: undefined,
      resumeUrl: "https://example.com/cv.pdf",
    });
  });

  describe("cache update on success", () => {
    const returned = {
      id: "app-new",
      jobOpportunityId: "job-1",
      status: "PENDING",
      appliedAt: "2026-10-10T00:00:00Z",
      updatedAt: "2026-10-10T00:00:00Z",
      jobOpportunity: { id: "job-1", title: "Job 1", club: { id: "c1", name: "HC" } },
    };

    beforeEach(() => {
      vi.mocked(graphqlClient).request = vi.fn().mockResolvedValue({ applyForJob: returned });
    });

    it("adds the returned application to the user's applications", async () => {
      const queryClient = new QueryClient();
      queryClient.setQueryData(["userApplications", mockUser.id], [
        { id: "app-old", jobOpportunityId: "job-0", status: "PENDING", appliedAt: "x" },
      ]);
      const { result } = renderHook(() => useApplyForJob(), {
        wrapper: wrapperFor(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ jobOpportunityId: "job-1" });
      });

      const cached = queryClient.getQueryData<Array<{ id: string }>>([
        "userApplications",
        mockUser.id,
      ]);
      expect(cached?.map((a) => a.id)).toEqual(["app-new", "app-old"]);
    });

    it("replaces a reactivated application instead of duplicating it", async () => {
      const queryClient = new QueryClient();
      queryClient.setQueryData(["userApplications", mockUser.id], [
        { ...returned, status: "WITHDRAWN" },
      ]);
      const { result } = renderHook(() => useApplyForJob(), {
        wrapper: wrapperFor(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ jobOpportunityId: "job-1" });
      });

      const cached = queryClient.getQueryData<Array<{ id: string; status: string }>>([
        "userApplications",
        mockUser.id,
      ]);
      expect(cached).toHaveLength(1);
      expect(cached?.[0].status).toBe("PENDING");
    });

    it("marks the opportunity as applied in the cached lists", async () => {
      const queryClient = new QueryClient();
      queryClient.setQueryData(["jobOpportunities", undefined], {
        jobOpportunities: [
          { id: "job-1", hasAppliedByCurrentUser: false },
          { id: "job-2", hasAppliedByCurrentUser: false },
        ],
      });
      const { result } = renderHook(() => useApplyForJob(), {
        wrapper: wrapperFor(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ jobOpportunityId: "job-1" });
      });

      const list = queryClient.getQueryData<{
        jobOpportunities: Array<{ id: string; hasAppliedByCurrentUser: boolean }>;
      }>(["jobOpportunities", undefined]);
      expect(list?.jobOpportunities).toEqual([
        { id: "job-1", hasAppliedByCurrentUser: true },
        { id: "job-2", hasAppliedByCurrentUser: false },
      ]);
    });

    it("invalidates the user's applications so they are refetched", async () => {
      const queryClient = new QueryClient();
      const invalidate = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHook(() => useApplyForJob(), {
        wrapper: wrapperFor(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ jobOpportunityId: "job-1" });
      });

      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["userApplications"] });
    });
  });

  it("does not print the applicant or the CV url to the console", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const { result } = renderHook(() => useApplyForJob(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync({
        jobOpportunityId: "job-1",
        resumeUrl: "https://example.com/cv.pdf",
      });
    });

    expect(log).not.toHaveBeenCalled();
  });
});
