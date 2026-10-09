/**
 * What: Tests for useApplyForJob.
 * Why: The mutation used to print the user id and the CV url to the browser
 *      console. Personal data must never be logged, and the request itself must
 *      keep sending the applicant and the CV.
 */
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { useApplyForJob } from "@/hooks/useJobApplications";
import { graphqlClient } from "@/lib/graphql-client";
import { useAuthStore } from "@/stores/useAuthStore";
import { APPLY_FOR_JOB } from "@/graphql";
import { mockUser } from "../test-utils";

vi.mock("@/lib/graphql-client");
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

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
