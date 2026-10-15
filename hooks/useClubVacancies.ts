import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
type JobsSnapshot = ReturnType<QueryClient["getQueriesData"]>;

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

function restoreJobs(queryClient: QueryClient, snapshot: JobsSnapshot | undefined) {
  snapshot?.forEach(([key, data]) => queryClient.setQueryData(key, data));
}

async function snapshotJobs(queryClient: QueryClient): Promise<JobsSnapshot> {
  await queryClient.cancelQueries({ queryKey: ["jobOpportunities"] });
  return queryClient.getQueriesData({ queryKey: ["jobOpportunities"] });
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

/**
 * Applications still waiting for an answer, counted per vacancy. Capped at one
 * page per status; the backend enforces the delete rule either way.
 */
export function useUnansweredApplicationCounts(clubId: string | null) {
  return useQuery<Record<string, number>>({
    queryKey: unansweredCountsQueryKey(clubId ?? ""),
    queryFn: async () => {
      const data = await graphqlClient.request<{
        pending: Array<{ id: string; jobOpportunity: { id: string } }>;
        underReview: Array<{ id: string; jobOpportunity: { id: string } }>;
      }>(GET_CLUB_UNANSWERED_APPLICATIONS, { clubId, limit: PAGE_LIMIT });
      return countApplicationsByJob([...data.pending, ...data.underReview]);
    },
    enabled: !!clubId,
  });
}

interface UpdateVacancyStatusVariables {
  id: string;
  clubId: string;
  status: JobStatus;
}

/** Close, reopen or mark as filled. FILLED stamps filledAt, which starts the delete cooldown. */
export function useUpdateVacancyStatus() {
  const queryClient = useQueryClient();
  const t = useTranslations("clubProfile.vacancies");

  return useMutation<unknown, Error, UpdateVacancyStatusVariables, { snapshot: JobsSnapshot }>({
    mutationFn: ({ id, status }) =>
      graphqlClient.request(UPDATE_JOB_OPPORTUNITY_STATUS, { id, status }),
    onMutate: async ({ id, status }) => {
      const snapshot = await snapshotJobs(queryClient);
      const now = new Date().toISOString();
      patchJobs(queryClient, (jobs) =>
        jobs.map((job) => {
          if (job.id !== id) return job;
          const wasFilled = job.status.toUpperCase() === "FILLED";
          const filledAt = status !== "FILLED" ? null : wasFilled ? job.filledAt : now;
          return { ...job, status, filledAt };
        }),
      );
      return { snapshot };
    },
    onError: (_error, _variables, context) => {
      restoreJobs(queryClient, context?.snapshot);
      toast.error(t("statusUpdateFailed"));
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

  return useMutation<unknown, Error, { id: string; clubId: string }, { snapshot: JobsSnapshot }>({
    mutationFn: ({ id }) => graphqlClient.request(DELETE_JOB_OPPORTUNITY, { id }),
    onMutate: async ({ id }) => {
      const snapshot = await snapshotJobs(queryClient);
      patchJobs(queryClient, (jobs) => jobs.filter((job) => job.id !== id));
      return { snapshot };
    },
    onSuccess: (_data, { id }) => {
      queryClient.removeQueries({ queryKey: ["jobOpportunity", id] });
      toast.success(t("deleted"));
    },
    onError: (error, _variables, context) => {
      restoreJobs(queryClient, context?.snapshot);
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
