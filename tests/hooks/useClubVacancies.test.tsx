/**
 * What: Tests for the club vacancy hooks (list, unanswered counts, status, delete, applicants, review).
 * Why: The owner tab acts on the cache first and rolls back on failure. A wrong
 *      key, a missing rollback or a swallowed backend code would leave the owner
 *      looking at a state the server never accepted.
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  clubVacanciesQueryKey,
  countApplicationsByJob,
  jobApplicantsQueryKey,
  unansweredCountsQueryKey,
  useClubVacancies,
  useDeleteVacancy,
  useJobApplicants,
  useUnansweredApplicationCounts,
  useUpdateApplicationStatus,
  useUpdateVacancyStatus,
} from "@/hooks/useClubVacancies";
import { graphqlClient } from "@/lib/graphql-client";
import {
  DELETE_JOB_OPPORTUNITY,
  GET_CLUB_JOB_OPPORTUNITIES,
  GET_CLUB_UNANSWERED_APPLICATIONS,
  GET_JOB_APPLICATIONS,
  UPDATE_APPLICATION_STATUS,
  UPDATE_JOB_OPPORTUNITY_STATUS,
} from "@/graphql";
import { toast } from "sonner";
import type { JobOpportunity } from "@/types/models/job-opportunity";
import type { JobApplication } from "@/types/models/job-application";

vi.mock("@/lib/graphql-client");
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const CLUB_ID = "club-1";

function makeJob(overrides: Partial<JobOpportunity> = {}): JobOpportunity {
  return {
    id: "job-1",
    title: "Goalkeeper",
    description: "d",
    positionType: "PLAYER",
    level: "PROFESSIONAL",
    country: "AR",
    city: "Rosario",
    salary: 0,
    currency: "ARS",
    benefits: [],
    status: "OPEN",
    filledAt: null,
    club: { id: CLUB_ID, name: "Club" },
    createdAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  } as JobOpportunity;
}

function makeApplication(overrides: Partial<JobApplication> = {}): JobApplication {
  return {
    id: "app-1",
    jobOpportunityId: "job-1",
    userId: "u1",
    status: "PENDING",
    appliedAt: "2026-10-02T00:00:00.000Z",
    updatedAt: "2026-10-02T00:00:00.000Z",
    ...overrides,
  };
}

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

/** A request that stays pending so the optimistic state can be inspected. */
function pendingRequest() {
  let reject!: (error: unknown) => void;
  let resolve!: (value: unknown) => void;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  vi.mocked(graphqlClient).request = vi.fn().mockReturnValue(promise);
  return { resolve, reject };
}

function backendError(code: string) {
  return { response: { errors: [{ message: "x", extensions: { code } }] } };
}

describe("countApplicationsByJob", () => {
  it("counts applications per vacancy", () => {
    const counts = countApplicationsByJob([
      { jobOpportunity: { id: "job-1" } },
      { jobOpportunity: { id: "job-1" } },
      { jobOpportunity: { id: "job-2" } },
    ]);
    expect(counts).toEqual({ "job-1": 2, "job-2": 1 });
  });
});

describe("useClubVacancies", () => {
  beforeEach(() => vi.clearAllMocks());

  it("asks the backend for the vacancies of the club, up to 100", async () => {
    const request = vi.fn().mockResolvedValue({ jobOpportunities: [makeJob()] });
    vi.mocked(graphqlClient).request = request;
    const { wrapper } = setup();

    const { result } = renderHook(() => useClubVacancies(CLUB_ID, "OPEN"), { wrapper });

    await waitFor(() => expect(result.current.data).toHaveLength(1));
    expect(request).toHaveBeenCalledWith(GET_CLUB_JOB_OPPORTUNITIES, {
      clubId: CLUB_ID,
      status: "OPEN",
      limit: 100,
    });
  });

  it("does not fetch without a club id", () => {
    const request = vi.fn();
    vi.mocked(graphqlClient).request = request;
    const { wrapper } = setup();

    renderHook(() => useClubVacancies(null), { wrapper });

    expect(request).not.toHaveBeenCalled();
  });
});

describe("useUnansweredApplicationCounts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("merges pending and under review applications per vacancy", async () => {
    const request = vi.fn().mockResolvedValue({
      pending: [{ id: "a", jobOpportunity: { id: "job-1" } }],
      underReview: [
        { id: "b", jobOpportunity: { id: "job-1" } },
        { id: "c", jobOpportunity: { id: "job-2" } },
      ],
    });
    vi.mocked(graphqlClient).request = request;
    const { wrapper } = setup();

    const { result } = renderHook(() => useUnansweredApplicationCounts(CLUB_ID), { wrapper });

    await waitFor(() =>
      expect(result.current.data).toEqual({
        counts: { "job-1": 2, "job-2": 1 },
        isComplete: true,
      }),
    );
    expect(request).toHaveBeenCalledWith(GET_CLUB_UNANSWERED_APPLICATIONS, {
      clubId: CLUB_ID,
      limit: 100,
    });
  });

  it("says the counts may be incomplete when a page came back full", async () => {
    const fullPage = Array.from({ length: 100 }, (_, index) => ({
      id: `a-${index}`,
      jobOpportunity: { id: "job-1" },
    }));
    vi.mocked(graphqlClient).request = vi
      .fn()
      .mockResolvedValue({ pending: fullPage, underReview: [] });
    const { wrapper } = setup();

    const { result } = renderHook(() => useUnansweredApplicationCounts(CLUB_ID), { wrapper });

    await waitFor(() => expect(result.current.data?.isComplete).toBe(false));
    expect(result.current.data?.counts["job-1"]).toBe(100);
  });
});

describe("useUpdateVacancyStatus", () => {
  beforeEach(() => vi.clearAllMocks());

  it("closes the vacancy in the cache before the server answers", async () => {
    const { queryClient, wrapper } = setup();
    const key = clubVacanciesQueryKey(CLUB_ID);
    queryClient.setQueryData(key, { jobOpportunities: [makeJob()] });
    const { resolve } = pendingRequest();

    const { result } = renderHook(() => useUpdateVacancyStatus(), { wrapper });
    act(() => result.current.mutate({ id: "job-1", clubId: CLUB_ID, status: "CLOSED" }));

    await waitFor(() =>
      expect(queryClient.getQueryData<{ jobOpportunities: JobOpportunity[] }>(key)?.jobOpportunities[0].status).toBe("CLOSED"),
    );
    expect(vi.mocked(graphqlClient).request).toHaveBeenCalledWith(UPDATE_JOB_OPPORTUNITY_STATUS, {
      id: "job-1",
      status: "CLOSED",
    });
    await act(async () => resolve({ updateJobOpportunity: { id: "job-1", status: "CLOSED" } }));
  });

  it("stamps filledAt when the vacancy is filled and clears it when reopened", async () => {
    const { queryClient, wrapper } = setup();
    const key = clubVacanciesQueryKey(CLUB_ID);
    queryClient.setQueryData(key, { jobOpportunities: [makeJob()] });
    vi.mocked(graphqlClient).request = vi.fn().mockResolvedValue({});

    const { result } = renderHook(() => useUpdateVacancyStatus(), { wrapper });
    const read = () => queryClient.getQueryData<{ jobOpportunities: JobOpportunity[] }>(key)?.jobOpportunities[0];

    await act(async () => result.current.mutate({ id: "job-1", clubId: CLUB_ID, status: "FILLED" }));
    await waitFor(() => expect(read()?.status).toBe("FILLED"));
    expect(read()?.filledAt).toEqual(expect.any(String));

    await act(async () => result.current.mutate({ id: "job-1", clubId: CLUB_ID, status: "OPEN" }));
    await waitFor(() => expect(read()?.status).toBe("OPEN"));
    expect(read()?.filledAt).toBeNull();
  });

  it("rolls back and warns when the server refuses", async () => {
    const { queryClient, wrapper } = setup();
    const key = clubVacanciesQueryKey(CLUB_ID);
    queryClient.setQueryData(key, { jobOpportunities: [makeJob()] });
    const { reject } = pendingRequest();

    const { result } = renderHook(() => useUpdateVacancyStatus(), { wrapper });
    act(() => result.current.mutate({ id: "job-1", clubId: CLUB_ID, status: "CLOSED" }));
    await act(async () => reject(backendError("INTERNAL_ERROR")));

    await waitFor(() =>
      expect(queryClient.getQueryData<{ jobOpportunities: JobOpportunity[] }>(key)?.jobOpportunities[0].status).toBe("OPEN"),
    );
    expect(toast.error).toHaveBeenCalledWith("statusUpdateFailed");
  });

  it("explains that the club already has 5 open vacancies when reopening one", async () => {
    const { queryClient, wrapper } = setup();
    const key = clubVacanciesQueryKey(CLUB_ID);
    queryClient.setQueryData(key, { jobOpportunities: [makeJob({ status: "CLOSED" })] });
    const { reject } = pendingRequest();

    const { result } = renderHook(() => useUpdateVacancyStatus(), { wrapper });
    act(() => result.current.mutate({ id: "job-1", clubId: CLUB_ID, status: "OPEN" }));
    await act(async () => reject(backendError("ACTIVE_JOBS_LIMIT_REACHED")));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("reopenLimitReached"));
    expect(toast.error).not.toHaveBeenCalledWith("statusUpdateFailed");
    expect(
      queryClient.getQueryData<{ jobOpportunities: JobOpportunity[] }>(key)?.jobOpportunities[0].status,
    ).toBe("CLOSED");
  });

  it("explains that the club must be verified when reopening is refused for that", async () => {
    const { queryClient, wrapper } = setup();
    const key = clubVacanciesQueryKey(CLUB_ID);
    queryClient.setQueryData(key, { jobOpportunities: [makeJob({ status: "CLOSED" })] });
    const { reject } = pendingRequest();

    const { result } = renderHook(() => useUpdateVacancyStatus(), { wrapper });
    act(() => result.current.mutate({ id: "job-1", clubId: CLUB_ID, status: "OPEN" }));
    await act(async () => reject(backendError("CLUB_NOT_VERIFIED")));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("reopenNotVerified"));
    expect(toast.error).not.toHaveBeenCalledWith("statusUpdateFailed");
    expect(
      queryClient.getQueryData<{ jobOpportunities: JobOpportunity[] }>(key)?.jobOpportunities[0].status,
    ).toBe("CLOSED");
  });
});

describe("useDeleteVacancy", () => {
  beforeEach(() => vi.clearAllMocks());

  it("removes the vacancy from the cache right away and confirms", async () => {
    const { queryClient, wrapper } = setup();
    const key = clubVacanciesQueryKey(CLUB_ID);
    queryClient.setQueryData(key, { jobOpportunities: [makeJob(), makeJob({ id: "job-2" })] });
    vi.mocked(graphqlClient).request = vi.fn().mockResolvedValue({ deleteJobOpportunity: true });

    const { result } = renderHook(() => useDeleteVacancy(), { wrapper });
    await act(async () => result.current.mutate({ id: "job-1", clubId: CLUB_ID }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("deleted"));
    expect(vi.mocked(graphqlClient).request).toHaveBeenCalledWith(DELETE_JOB_OPPORTUNITY, { id: "job-1" });
    const ids = queryClient
      .getQueryData<{ jobOpportunities: JobOpportunity[] }>(key)
      ?.jobOpportunities.map((job) => job.id);
    expect(ids).not.toContain("job-1");
  });

  it.each([
    ["JOB_HAS_UNANSWERED_APPLICATIONS", "deleteBlockedUnanswered"],
    ["JOB_FILLED_COOLDOWN", "deleteBlockedCooldown"],
    ["INTERNAL_ERROR", "deleteFailed"],
  ])("restores the vacancy and explains a %s refusal", async (code, messageKey) => {
    const { queryClient, wrapper } = setup();
    const key = clubVacanciesQueryKey(CLUB_ID);
    queryClient.setQueryData(key, { jobOpportunities: [makeJob()] });
    const { reject } = pendingRequest();

    const { result } = renderHook(() => useDeleteVacancy(), { wrapper });
    act(() => result.current.mutate({ id: "job-1", clubId: CLUB_ID }));
    await act(async () => reject(backendError(code)));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(messageKey));
    expect(
      queryClient.getQueryData<{ jobOpportunities: JobOpportunity[] }>(key)?.jobOpportunities,
    ).toHaveLength(1);
  });
});

describe("useJobApplicants", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads the applicants of one vacancy", async () => {
    const request = vi.fn().mockResolvedValue({ jobApplications: [makeApplication()] });
    vi.mocked(graphqlClient).request = request;
    const { wrapper } = setup();

    const { result } = renderHook(() => useJobApplicants("job-1"), { wrapper });

    await waitFor(() => expect(result.current.data).toHaveLength(1));
    expect(request).toHaveBeenCalledWith(GET_JOB_APPLICATIONS, { jobOpportunityId: "job-1", limit: 100 });
  });

  it("does not fetch until a vacancy is selected", () => {
    const request = vi.fn();
    vi.mocked(graphqlClient).request = request;
    const { wrapper } = setup();

    renderHook(() => useJobApplicants(null), { wrapper });

    expect(request).not.toHaveBeenCalled();
  });
});

describe("useUpdateApplicationStatus", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the new status at once and refreshes the unanswered counts", async () => {
    const { queryClient, wrapper } = setup();
    queryClient.setQueryData(jobApplicantsQueryKey("job-1"), [makeApplication()]);
    queryClient.setQueryData(unansweredCountsQueryKey(CLUB_ID), { "job-1": 1 });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    vi.mocked(graphqlClient).request = vi.fn().mockResolvedValue({});

    const { result } = renderHook(() => useUpdateApplicationStatus(), { wrapper });
    await act(async () =>
      result.current.mutate({
        applicationId: "app-1",
        jobOpportunityId: "job-1",
        clubId: CLUB_ID,
        status: "ACCEPTED",
      }),
    );

    await waitFor(() =>
      expect(queryClient.getQueryData<JobApplication[]>(jobApplicantsQueryKey("job-1"))?.[0].status).toBe("ACCEPTED"),
    );
    expect(vi.mocked(graphqlClient).request).toHaveBeenCalledWith(UPDATE_APPLICATION_STATUS, {
      applicationId: "app-1",
      status: "ACCEPTED",
      notes: undefined,
    });
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: unansweredCountsQueryKey(CLUB_ID) }),
    );
  });

  it("restores the previous status when the server refuses", async () => {
    const { queryClient, wrapper } = setup();
    queryClient.setQueryData(jobApplicantsQueryKey("job-1"), [makeApplication()]);
    const { reject } = pendingRequest();

    const { result } = renderHook(() => useUpdateApplicationStatus(), { wrapper });
    act(() =>
      result.current.mutate({
        applicationId: "app-1",
        jobOpportunityId: "job-1",
        clubId: CLUB_ID,
        status: "REJECTED",
      }),
    );
    await act(async () => reject(backendError("INTERNAL_ERROR")));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("applicationUpdateFailed"));
    expect(queryClient.getQueryData<JobApplication[]>(jobApplicantsQueryKey("job-1"))?.[0].status).toBe("PENDING");
  });
});
