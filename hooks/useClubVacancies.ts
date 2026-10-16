import {
  QueryClient,
  type QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { graphqlClient } from "@/lib/graphql-client";
import { parseApiError } from "@/lib/auth-errors";
import {
  DELETE_JOB_OPPORTUNITY,
  GET_CLUB_JOB_OPPORTUNITIES,
  GET_CLUB_UNANSWERED_APPLICATIONS,
  GET_JOB_APPLICATIONS,
  UPDATE_APPLICATION_STATUS,
  UPDATE_JOB_OPPORTUNITY_STATUS,
} from "@/graphql";
import type { JobOpportunity, JobStatus } from "@/types/models/job-opportunity";
import type { JobApplication } from "@/types/models/job-application";

/** A club does not publish, or receive, more than one backend page at once. */
const PAGE_LIMIT = 100;

type JobsData = { jobOpportunities: JobOpportunity[] };

// Every key starts with "jobOpportunities", so invalidating that prefix also
// refreshes the club tab, the public lists and the detail modal.
export const clubVacanciesQueryKey = (clubId: string, status?: JobStatus) =>
  ["jobOpportunities", "club", clubId, status ?? "ALL"] as const;
export const unansweredCountsQueryKey = (clubId: string) =>
  ["clubUnansweredApplications", clubId] as const;
export const jobApplicantsQueryKey = (jobOpportunityId: string) =>
  ["jobApplications", jobOpportunityId] as const;

export function countApplicationsByJob(
  applications: ReadonlyArray<{ jobOpportunity: { id: string } }>,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const application of applications) {
    const jobId = application.jobOpportunity.id;
    counts[jobId] = (counts[jobId] ?? 0) + 1;
  }
  return counts;
}

function patchJobs(queryClient: QueryClient, update: (jobs: JobOpportunity[]) => JobOpportunity[]) {
  queryClient.setQueriesData<JobsData>(
    { queryKey: ["jobOpportunities"] },
    (old) => old && { ...old, jobOpportunities: update(old.jobOpportunities) },
  );
}

// A failed change is undone for ITS vacancy only. Restoring a snapshot of every list
// would also wipe whatever the owner changed on other vacancies while this one was in
// flight, so each mutation remembers just what it touched.

function cachedJobLists(queryClient: QueryClient) {
  return queryClient
    .getQueriesData<JobsData>({ queryKey: ["jobOpportunities"] })
    .filter(([, data]) => Array.isArray(data?.jobOpportunities)) as Array<
    [QueryKey, JobsData]
  >;
}

function findCachedJob(queryClient: QueryClient, id: string): JobOpportunity | undefined {
  for (const [, data] of cachedJobLists(queryClient)) {
    const job = data.jobOpportunities.find((candidate) => candidate.id === id);
    if (job) return job;
  }
  return undefined;
}

/** Stop in-flight refetches from overwriting the optimistic change. */
async function cancelJobQueries(queryClient: QueryClient) {
  await queryClient.cancelQueries({ queryKey: ["jobOpportunities"] });
}

type PreviousStatus = Pick<JobOpportunity, "status" | "filledAt">;

/**
 * Undo an optimistic status change, but only while the vacancy still shows the status
 * this mutation applied: a newer change to the same vacancy must not be undone by an
 * older one that failed.
 */
function revertStatus(
  queryClient: QueryClient,
  id: string,
  applied: JobStatus,
  previous: PreviousStatus,
) {
  patchJobs(queryClient, (jobs) =>
    jobs.map((job) =>
      job.id === id && job.status === applied
        ? { ...job, status: previous.status, filledAt: previous.filledAt }
        : job,
    ),
  );
}

/** Where a vacancy sat in each cached list before an optimistic delete removed it. */
type RemovedFrom = Array<{ queryKey: QueryKey; index: number; job: JobOpportunity }>;

function removeJob(queryClient: QueryClient, id: string): RemovedFrom {
  const removedFrom: RemovedFrom = [];
  for (const [queryKey, data] of cachedJobLists(queryClient)) {
    const index = data.jobOpportunities.findIndex((job) => job.id === id);
    if (index >= 0) removedFrom.push({ queryKey, index, job: data.jobOpportunities[index] });
  }
  patchJobs(queryClient, (jobs) => jobs.filter((job) => job.id !== id));
  return removedFrom;
}

/** Put a deleted vacancy back where it was, unless a refetch already brought it back. */
function reinsertJob(queryClient: QueryClient, removedFrom: RemovedFrom) {
  for (const { queryKey, index, job } of removedFrom) {
    queryClient.setQueryData<JobsData>(queryKey, (old) => {
      if (!old || old.jobOpportunities.some((candidate) => candidate.id === job.id)) return old;
      const jobs = [...old.jobOpportunities];
      jobs.splice(Math.min(index, jobs.length), 0, job);
      return { ...old, jobOpportunities: jobs };
    });
  }
}

/** Vacancies of one club; the backend filters by club (and status when given). */
export function useClubVacancies(clubId: string | null, status?: JobStatus) {
  return useQuery<JobsData, Error, JobOpportunity[]>({
    queryKey: clubVacanciesQueryKey(clubId ?? "", status),
    queryFn: () =>
      graphqlClient.request<JobsData>(GET_CLUB_JOB_OPPORTUNITIES, {
        clubId,
        status,
        limit: PAGE_LIMIT,
      }),
    enabled: !!clubId,
    // The cache keeps the shape of the other "jobOpportunities" queries, so one
    // patch updates them all; consumers get the plain list.
    select: (data) => data.jobOpportunities,
  });
}

export interface UnansweredApplicationCounts {
  counts: Record<string, number>;
  /** False when a page came back full: some vacancy may have more than counted. */
  isComplete: boolean;
}

/**
 * Applications still waiting for an answer, counted per vacancy. Capped at one
 * page per status; when a page is full the counts are flagged incomplete so the
 * UI never treats a missing count as "no applications". The backend enforces the
 * delete rule either way.
 */
export function useUnansweredApplicationCounts(clubId: string | null) {
  return useQuery<UnansweredApplicationCounts>({
    queryKey: unansweredCountsQueryKey(clubId ?? ""),
    queryFn: async () => {
      const data = await graphqlClient.request<{
        pending: Array<{ id: string; jobOpportunity: { id: string } }>;
        underReview: Array<{ id: string; jobOpportunity: { id: string } }>;
      }>(GET_CLUB_UNANSWERED_APPLICATIONS, { clubId, limit: PAGE_LIMIT });
      return {
        counts: countApplicationsByJob([...data.pending, ...data.underReview]),
        isComplete: data.pending.length < PAGE_LIMIT && data.underReview.length < PAGE_LIMIT,
      };
    },
    enabled: !!clubId,
  });
}

interface UpdateVacancyStatusVariables {
  id: string;
  clubId: string;
  status: JobStatus;
}

/** Only reopening can be refused for a reason the owner can act on; the rest is a generic failure. */
function statusErrorKey(error: unknown) {
  switch (parseApiError(error).code) {
    case "ACTIVE_JOBS_LIMIT_REACHED":
      return "reopenLimitReached";
    case "CLUB_NOT_VERIFIED":
      return "reopenNotVerified";
    default:
      return "statusUpdateFailed";
  }
}

/** Close, reopen or mark as filled. FILLED stamps filledAt, which starts the delete cooldown. */
export function useUpdateVacancyStatus() {
  const queryClient = useQueryClient();
  const t = useTranslations("clubProfile.vacancies");

  return useMutation<unknown, Error, UpdateVacancyStatusVariables, { previous?: PreviousStatus }>({
    mutationFn: ({ id, status }) =>
      graphqlClient.request(UPDATE_JOB_OPPORTUNITY_STATUS, { id, status }),
    onMutate: async ({ id, status }) => {
      await cancelJobQueries(queryClient);
      const cached = findCachedJob(queryClient, id);
      const previous = cached && { status: cached.status, filledAt: cached.filledAt };
      const now = new Date().toISOString();
      patchJobs(queryClient, (jobs) =>
        jobs.map((job) => {
          if (job.id !== id) return job;
          const wasFilled = job.status.toUpperCase() === "FILLED";
          const filledAt = status !== "FILLED" ? null : wasFilled ? job.filledAt : now;
          return { ...job, status, filledAt };
        }),
      );
      return { previous };
    },
    onError: (error, { id, status }, context) => {
      if (context?.previous) revertStatus(queryClient, id, status, context.previous);
      toast.error(t(statusErrorKey(error)));
    },
    onSettled: (_data, _error, { id, clubId }) => {
      queryClient.invalidateQueries({ queryKey: ["jobOpportunities"] });
      queryClient.invalidateQueries({ queryKey: ["jobOpportunity", id] });
      queryClient.invalidateQueries({ queryKey: ["club", clubId] });
    },
  });
}

function deleteErrorKey(error: unknown) {
  switch (parseApiError(error).code) {
    case "JOB_HAS_UNANSWERED_APPLICATIONS":
      return "deleteBlockedUnanswered";
    case "JOB_FILLED_COOLDOWN":
      return "deleteBlockedCooldown";
    default:
      return "deleteFailed";
  }
}

/** The backend decides whether the delete is allowed; the UI only mirrors its rule. */
export function useDeleteVacancy() {
  const queryClient = useQueryClient();
  const t = useTranslations("clubProfile.vacancies");

  return useMutation<unknown, Error, { id: string; clubId: string }, { removedFrom: RemovedFrom }>({
    mutationFn: ({ id }) => graphqlClient.request(DELETE_JOB_OPPORTUNITY, { id }),
    onMutate: async ({ id }) => {
      await cancelJobQueries(queryClient);
      return { removedFrom: removeJob(queryClient, id) };
    },
    onSuccess: (_data, { id }) => {
      queryClient.removeQueries({ queryKey: ["jobOpportunity", id] });
      toast.success(t("deleted"));
    },
    onError: (error, _variables, context) => {
      if (context) reinsertJob(queryClient, context.removedFrom);
      toast.error(t(deleteErrorKey(error)));
    },
    onSettled: (_data, _error, { clubId }) => {
      queryClient.invalidateQueries({ queryKey: ["jobOpportunities"] });
      queryClient.invalidateQueries({ queryKey: ["club", clubId] });
      queryClient.invalidateQueries({ queryKey: unansweredCountsQueryKey(clubId) });
    },
  });
}

/** Applicants of one vacancy. Pass null until the owner opens the panel. */
export function useJobApplicants(jobOpportunityId: string | null) {
  return useQuery<JobApplication[]>({
    queryKey: jobApplicantsQueryKey(jobOpportunityId ?? ""),
    queryFn: async () => {
      const data = await graphqlClient.request<{ jobApplications: JobApplication[] }>(
        GET_JOB_APPLICATIONS,
        { jobOpportunityId, limit: PAGE_LIMIT },
      );
      return data.jobApplications;
    },
    enabled: !!jobOpportunityId,
  });
}

interface UpdateApplicationStatusVariables {
  applicationId: string;
  jobOpportunityId: string;
  clubId: string;
  status: "UNDER_REVIEW" | "ACCEPTED" | "REJECTED";
  notes?: string;
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();
  const t = useTranslations("clubProfile.vacancies");

  return useMutation<
    unknown,
    Error,
    UpdateApplicationStatusVariables,
    { previous: JobApplication[] | undefined }
  >({
    mutationFn: ({ applicationId, status, notes }) =>
      graphqlClient.request(UPDATE_APPLICATION_STATUS, { applicationId, status, notes }),
    onMutate: async ({ applicationId, jobOpportunityId, status }) => {
      const key = jobApplicantsQueryKey(jobOpportunityId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<JobApplication[]>(key);
      queryClient.setQueryData<JobApplication[]>(key, (old) =>
        old?.map((application) =>
          application.id === applicationId ? { ...application, status } : application,
        ),
      );
      return { previous };
    },
    onError: (_error, { jobOpportunityId }, context) => {
      queryClient.setQueryData(jobApplicantsQueryKey(jobOpportunityId), context?.previous);
      toast.error(t("applicationUpdateFailed"));
    },
    onSettled: (_data, _error, { jobOpportunityId, clubId }) => {
      queryClient.invalidateQueries({ queryKey: jobApplicantsQueryKey(jobOpportunityId) });
      queryClient.invalidateQueries({ queryKey: unansweredCountsQueryKey(clubId) });
    },
  });
}
