/**
 * Mirrors the backend rule (JobsService.delete). The backend stays the source of
 * truth; this only lets the UI explain why a delete is not available yet.
 *
 * A club can delete a job when every application was answered (none PENDING or
 * UNDER_REVIEW), or when the job has been FILLED for FILLED_DELETE_COOLDOWN_DAYS.
 */
export const FILLED_DELETE_COOLDOWN_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

export type JobDeletionState =
  | { canDelete: true }
  | { canDelete: false; reason: "UNANSWERED_APPLICATIONS" }
  | { canDelete: false; reason: "FILLED_COOLDOWN"; availableAt: Date };

interface JobDeletionInput {
  status: string;
  filledAt: string | null | undefined;
  unansweredCount: number;
  now?: Date;
}

export function getJobDeletionState({
  status,
  filledAt,
  unansweredCount,
  now = new Date(),
}: JobDeletionInput): JobDeletionState {
  if (unansweredCount <= 0) return { canDelete: true };

  const filledTime = filledAt ? new Date(filledAt).getTime() : Number.NaN;
  if (status.toUpperCase() === "FILLED" && !Number.isNaN(filledTime)) {
    const availableAt = new Date(filledTime + FILLED_DELETE_COOLDOWN_DAYS * DAY_MS);
    if (now.getTime() >= availableAt.getTime()) return { canDelete: true };
    return { canDelete: false, reason: "FILLED_COOLDOWN", availableAt };
  }

  return { canDelete: false, reason: "UNANSWERED_APPLICATIONS" };
}
