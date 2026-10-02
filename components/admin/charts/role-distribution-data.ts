import type { AdminDashboardStats, RoleCount } from "@/types/models/admin";

type RoleCounts = Pick<
  AdminDashboardStats,
  "playersCount" | "coachesCount" | "clubsCount" | "umpiresCount" | "superAdminsCount"
>;

/** Users-by-role series for the overview pie chart. */
export function buildRoleDistribution(stats: RoleCounts): RoleCount[] {
  return [
    { role: "PLAYER", count: stats.playersCount },
    { role: "COACH", count: stats.coachesCount },
    { role: "CLUB", count: stats.clubsCount },
    { role: "UMPIRE", count: stats.umpiresCount },
    { role: "SUPERADMIN", count: stats.superAdminsCount },
  ];
}
