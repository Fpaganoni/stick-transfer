/**
 * What: Unit tests for useSavedJobs / useToggleSaveJob.
 * Why: Saved jobs live on the server per account. The toggle must feel instant
 *      (optimistic update on ["savedJobs"] and ["jobOpportunities"]), roll back
 *      cleanly when the server rejects, and never query without a session.
 */
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { toast } from "sonner";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useSavedJobs, useToggleSaveJob } from "@/hooks/useSavedJobs";
import { graphqlClient } from "@/lib/graphql-client";
import { useAuthStore } from "@/stores/useAuthStore";
import { useOpportunitiesStore } from "@/stores/useOpportunitiesStore";
import { GET_SAVED_JOBS, SAVE_JOB, UNSAVE_JOB } from "@/graphql";
import type { JobOpportunity } from "@/types/models/job-opportunity";
import { mockUser } from "../test-utils";

vi.mock("@/lib/graphql-client");
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

function buildJob(id: string, isSavedByCurrentUser: boolean): JobOpportunity {
  return {
    id,
    title: `Job ${id}`,
    isSavedByCurrentUser,
    club: { id: "club-1", name: "Club" },
  } as unknown as JobOpportunity;
}

interface JobsData {
  jobOpportunities: JobOpportunity[];
}
interface SavedData {
  savedJobOpportunities: JobOpportunity[];
}

function createHarness() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return { queryClient, Wrapper };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function flagOf(queryClient: QueryClient, id: string) {
  const data = queryClient.getQueryData<JobsData>(["jobOpportunities", undefined]);
  return data?.jobOpportunities.find((job) => job.id === id)?.isSavedByCurrentUser;
}

describe("useSavedJobs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, isLoggedIn: false });
  });

  it("does not query the server without a session", async () => {
    const request = vi.fn().mockResolvedValue({ savedJobOpportunities: [] });
    vi.mocked(graphqlClient).request = request;
    const { Wrapper } = createHarness();

    const { result } = renderHook(() => useSavedJobs(), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(request).not.toHaveBeenCalled();
  });

  it("fetches savedJobOpportunities when logged in", async () => {
    useAuthStore.setState({ user: mockUser, isLoggedIn: true });
    const saved = [buildJob("job-1", true)];
    const request = vi.fn().mockResolvedValue({ savedJobOpportunities: saved });
    vi.mocked(graphqlClient).request = request;
    const { Wrapper } = createHarness();

    const { result } = renderHook(() => useSavedJobs(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.data).toEqual({ savedJobOpportunities: saved }));
    expect(request).toHaveBeenCalledWith(GET_SAVED_JOBS);
  });
});

describe("useToggleSaveJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: mockUser, isLoggedIn: true });
    useOpportunitiesStore.setState({ selectedOpportunity: null });
  });

  it("calls SAVE_JOB when saving and UNSAVE_JOB when unsaving", async () => {
    const request = vi.fn().mockResolvedValue(true);
    vi.mocked(graphqlClient).request = request;
    const { Wrapper } = createHarness();
    const { result } = renderHook(() => useToggleSaveJob(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ job: buildJob("job-1", false), save: true });
    });
    await act(async () => {
      await result.current.mutateAsync({ job: buildJob("job-1", true), save: false });
    });

    expect(request).toHaveBeenNthCalledWith(1, SAVE_JOB, { jobOpportunityId: "job-1" });
    expect(request).toHaveBeenNthCalledWith(2, UNSAVE_JOB, { jobOpportunityId: "job-1" });
  });

  it("flips the flag and adds the job to savedJobs before the server answers", async () => {
    const pending = deferred<boolean>();
    vi.mocked(graphqlClient).request = vi.fn().mockReturnValue(pending.promise);
    const { queryClient, Wrapper } = createHarness();
    const job = buildJob("job-1", false);
    queryClient.setQueryData<JobsData>(["jobOpportunities", undefined], {
      jobOpportunities: [job, buildJob("job-2", false)],
    });
    queryClient.setQueryData<SavedData>(["savedJobs"], { savedJobOpportunities: [] });
    const { result } = renderHook(() => useToggleSaveJob(), { wrapper: Wrapper });

    act(() => {
      result.current.mutate({ job, save: true });
    });

    await waitFor(() => expect(flagOf(queryClient, "job-1")).toBe(true));
    expect(flagOf(queryClient, "job-2")).toBe(false);
    expect(
      queryClient.getQueryData<SavedData>(["savedJobs"])?.savedJobOpportunities.map((j) => j.id),
    ).toEqual(["job-1"]);
    pending.resolve(true);
  });

  it("removes the job from savedJobs when unsaving", async () => {
    const pending = deferred<boolean>();
    vi.mocked(graphqlClient).request = vi.fn().mockReturnValue(pending.promise);
    const { queryClient, Wrapper } = createHarness();
    const job = buildJob("job-1", true);
    queryClient.setQueryData<SavedData>(["savedJobs"], {
      savedJobOpportunities: [job, buildJob("job-2", true)],
    });
    const { result } = renderHook(() => useToggleSaveJob(), { wrapper: Wrapper });

    act(() => {
      result.current.mutate({ job, save: false });
    });

    await waitFor(() =>
      expect(
        queryClient.getQueryData<SavedData>(["savedJobs"])?.savedJobOpportunities.map((j) => j.id),
      ).toEqual(["job-2"]),
    );
    pending.resolve(true);
  });

  it("rolls every cache back when the server rejects", async () => {
    const pending = deferred<boolean>();
    vi.mocked(graphqlClient).request = vi.fn().mockReturnValue(pending.promise);
    const { queryClient, Wrapper } = createHarness();
    const job = buildJob("job-1", false);
    queryClient.setQueryData<JobsData>(["jobOpportunities", undefined], {
      jobOpportunities: [job],
    });
    queryClient.setQueryData<SavedData>(["savedJobs"], { savedJobOpportunities: [] });
    const { result } = renderHook(() => useToggleSaveJob(), { wrapper: Wrapper });

    act(() => {
      result.current.mutate({ job, save: true });
    });
    await waitFor(() => expect(flagOf(queryClient, "job-1")).toBe(true));

    await act(async () => {
      pending.reject(new Error("boom"));
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(flagOf(queryClient, "job-1")).toBe(false);
    expect(queryClient.getQueryData<SavedData>(["savedJobs"])?.savedJobOpportunities).toEqual([]);
  });

  it("keeps the open detail modal job in sync and restores it on error", async () => {
    const pending = deferred<boolean>();
    vi.mocked(graphqlClient).request = vi.fn().mockReturnValue(pending.promise);
    const { Wrapper } = createHarness();
    const job = buildJob("job-1", false);
    useOpportunitiesStore.setState({ selectedOpportunity: job });
    const { result } = renderHook(() => useToggleSaveJob(), { wrapper: Wrapper });

    act(() => {
      result.current.mutate({ job, save: true });
    });
    await waitFor(() =>
      expect(useOpportunitiesStore.getState().selectedOpportunity?.isSavedByCurrentUser).toBe(true),
    );

    await act(async () => {
      pending.reject(new Error("boom"));
    });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(useOpportunitiesStore.getState().selectedOpportunity?.isSavedByCurrentUser).toBe(false);
  });

  it("keeps the modal on the job the user opened while the request was in flight", async () => {
    const pending = deferred<boolean>();
    vi.mocked(graphqlClient).request = vi.fn().mockReturnValue(pending.promise);
    const { Wrapper } = createHarness();
    const job = buildJob("job-1", false);
    const { result } = renderHook(() => useToggleSaveJob(), { wrapper: Wrapper });

    act(() => {
      result.current.mutate({ job, save: true });
    });
    // The request leaves after onMutate took its snapshot, with no modal open.
    await waitFor(() => expect(graphqlClient.request).toHaveBeenCalled());
    act(() => {
      useOpportunitiesStore.setState({ selectedOpportunity: job, isModalOpen: true });
    });

    await act(async () => {
      pending.reject(new Error("boom"));
    });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(useOpportunitiesStore.getState().selectedOpportunity).toMatchObject({
      id: "job-1",
      isSavedByCurrentUser: false,
    });
  });

  it("does not write the previous account's data back when it fails after the session was cleared", async () => {
    const pending = deferred<boolean>();
    vi.mocked(graphqlClient).request = vi.fn().mockReturnValue(pending.promise);
    const { queryClient, Wrapper } = createHarness();
    const job = buildJob("job-1", false);
    queryClient.setQueryData<JobsData>(["jobOpportunities", undefined], {
      jobOpportunities: [job],
    });
    queryClient.setQueryData<SavedData>(["savedJobs"], { savedJobOpportunities: [] });
    const { result } = renderHook(() => useToggleSaveJob(), { wrapper: Wrapper });

    act(() => {
      result.current.mutate({ job, save: true });
    });
    await waitFor(() => expect(flagOf(queryClient, "job-1")).toBe(true));

    // Logout happens while the request is still in flight.
    act(() => {
      queryClient.clear();
      useAuthStore.setState({ user: null, isLoggedIn: false });
    });
    await act(async () => {
      pending.reject(new Error("401"));
    });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(queryClient.getQueryData(["savedJobs"])).toBeUndefined();
    expect(queryClient.getQueryData(["jobOpportunities", undefined])).toBeUndefined();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("tells the user when the change could not be saved", async () => {
    vi.mocked(graphqlClient).request = vi.fn().mockRejectedValue(new Error("boom"));
    const { Wrapper } = createHarness();
    const { result } = renderHook(() => useToggleSaveJob(), { wrapper: Wrapper });

    await act(async () => {
      await result.current
        .mutateAsync({ job: buildJob("job-1", false), save: true })
        .catch(() => undefined);
    });

    expect(toast.error).toHaveBeenCalledTimes(1);
  });

  it("invalidates both caches once the mutation settles", async () => {
    vi.mocked(graphqlClient).request = vi.fn().mockResolvedValue(true);
    const { queryClient, Wrapper } = createHarness();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useToggleSaveJob(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ job: buildJob("job-1", false), save: true });
    });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["savedJobs"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["jobOpportunities"] });
  });
});
