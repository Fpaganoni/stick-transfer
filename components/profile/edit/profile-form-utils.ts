interface TrajectoryFormValue {
  id?: string;
  title: string;
  organization?: string;
  period: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
}

/** Accepts either an ISO string or a ms timestamp and returns an ISO string. */
function normalizeDate(value?: string): string | undefined {
  if (!value || value.trim() === "") return undefined;
  return !isNaN(Number(value)) ? new Date(Number(value)).toISOString() : value;
}

/** Maps trajectory form rows to the shape updateUser expects. */
export function formatTrajectories(trajectories?: TrajectoryFormValue[]) {
  return trajectories?.map((t) => ({
    id: t.id,
    title: t.title,
    organization: t.organization,
    period: t.period,
    description: t.description || "",
    startDate: normalizeDate(t.startDate),
    endDate: normalizeDate(t.endDate),
    isCurrent: t.isCurrent,
  }));
}
