"use client";

import { useTranslations } from "next-intl";
import {
  Users,
  Building2,
  Briefcase,
  Newspaper,
  RefreshCw,
  UserCheck,
  UserPlus,
  ClipboardList,
  Flag,
} from "lucide-react";
import { useAdminStats } from "@/hooks/useAdminStats";
import { StatCard } from "@/components/admin/stat-card";
import { RoleDistributionChart } from "@/components/admin/charts/role-distribution-chart";
import {
  StatusBarChart,
  StatusBarDatum,
} from "@/components/admin/charts/status-bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyContent,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";

const VERIFICATION_COLORS: Record<string, string> = {
  VERIFIED: "var(--success)",
  PENDING: "var(--warning)",
  REJECTED: "var(--error)",
  UNVERIFIED: "var(--foreground-muted)",
};

const JOB_STATUS_COLORS: Record<string, string> = {
  OPEN: "var(--success)",
  CLOSED: "var(--foreground-muted)",
  FILLED: "var(--info)",
};

const APPLICATION_COLORS: Record<string, string> = {
  PENDING: "var(--warning)",
  ACCEPTED: "var(--success)",
  REJECTED: "var(--error)",
};

const REPORT_STATUS_COLORS: Record<string, string> = {
  PENDING: "var(--warning)",
  REVIEWED: "var(--info)",
  ACTION_TAKEN: "var(--success)",
};

function bars(entries: [string, number][], colors: Record<string, string>): StatusBarDatum[] {
  return entries.map(([label, value]) => ({
    label,
    value,
    color: colors[label] ?? "var(--foreground-muted)",
  }));
}

export default function AdminOverviewPage() {
  const t = useTranslations("admin.overview");
  const { data, isLoading, isError, refetch } = useAdminStats();
  const stats = data?.adminDashboardStats;

  if (isError) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RefreshCw className="size-6" />
          </EmptyMedia>
          <EmptyTitle>{t("errorTitle")}</EmptyTitle>
          <EmptyDescription>{t("errorDescription")}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => refetch()}>{t("retry")}</Button>
        </EmptyContent>
      </Empty>
    );
  }

  const totalJobs = stats
    ? stats.openJobsCount + stats.closedJobsCount + stats.filledJobsCount
    : 0;
  const totalNews = stats ? stats.publishedNewsCount + stats.draftNewsCount : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-foreground-muted">{t("subtitle")}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("stats.totalUsers")}
          value={stats?.totalUsersCount}
          icon={Users}
          delta={
            stats
              ? t("stats.newInLast30Days", { count: stats.newUsersLast30Days })
              : undefined
          }
          isLoading={isLoading}
        />
        <StatCard
          label={t("stats.activeUsers")}
          value={stats?.activeUsersCount}
          icon={UserCheck}
          delta={
            stats
              ? t("stats.newUsers7dDelta", { count: stats.newUsersLast7Days })
              : undefined
          }
          iconClassName="bg-success/10 text-success"
          isLoading={isLoading}
        />
        <StatCard
          label={t("stats.totalClubs")}
          value={stats?.clubsCount}
          icon={Building2}
          delta={
            stats ? t("stats.verifiedCount", { count: stats.verifiedClubsCount }) : undefined
          }
          iconClassName="bg-accent/10 text-accent"
          isLoading={isLoading}
        />
        <StatCard
          label={t("stats.openJobs")}
          value={stats ? `${stats.openJobsCount} / ${totalJobs}` : undefined}
          icon={Briefcase}
          iconClassName="bg-info/10 text-info"
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("stats.totalApplications")}
          value={stats?.totalApplicationsCount}
          icon={ClipboardList}
          delta={
            stats
              ? t("stats.pendingCount", { count: stats.pendingApplicationsCount })
              : undefined
          }
          iconClassName="bg-warning/10 text-warning"
          isLoading={isLoading}
        />
        <StatCard
          label={t("stats.totalReports")}
          value={stats?.totalReportsCount}
          icon={Flag}
          delta={
            stats ? t("stats.pendingCount", { count: stats.pendingReportsCount }) : undefined
          }
          iconClassName="bg-error/10 text-error"
          isLoading={isLoading}
        />
        <StatCard
          label={t("stats.publishedNews")}
          value={stats ? `${stats.publishedNewsCount} / ${totalNews}` : undefined}
          icon={Newspaper}
          iconClassName="bg-primary/10 text-primary"
          isLoading={isLoading}
        />
        <StatCard
          label={t("stats.newUsers7d")}
          value={stats?.newUsersLast7Days}
          icon={UserPlus}
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("charts.usersByRole")}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading || !stats ? (
                  <Skeleton className="h-[260px] w-full" />
                ) : (
                  <RoleDistributionChart
                    data={[
                      { role: "PLAYER", count: stats.playersCount },
                      { role: "COACH", count: stats.coachesCount },
                      { role: "CLUB", count: stats.clubsCount },
                      { role: "SUPERADMIN", count: stats.superAdminsCount },
                    ]}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("charts.clubsByVerification")}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading || !stats ? (
                  <Skeleton className="h-60 w-full" />
                ) : (
                  <StatusBarChart
                    data={bars(
                      [
                        ["VERIFIED", stats.verifiedClubsCount],
                        ["PENDING", stats.pendingVerificationClubsCount],
                        ["UNVERIFIED", stats.unverifiedClubsCount],
                        ["REJECTED", stats.rejectedClubsCount],
                      ],
                      VERIFICATION_COLORS,
                    )}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("charts.jobsByStatus")}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading || !stats ? (
                  <Skeleton className="h-60 w-full" />
                ) : (
                  <StatusBarChart
                    data={bars(
                      [
                        ["OPEN", stats.openJobsCount],
                        ["CLOSED", stats.closedJobsCount],
                        ["FILLED", stats.filledJobsCount],
                      ],
                      JOB_STATUS_COLORS,
                    )}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("charts.applicationsByStatus")}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading || !stats ? (
                  <Skeleton className="h-60 w-full" />
                ) : (
                  <StatusBarChart
                    data={bars(
                      [
                        ["PENDING", stats.pendingApplicationsCount],
                        ["ACCEPTED", stats.acceptedApplicationsCount],
                        ["REJECTED", stats.rejectedApplicationsCount],
                      ],
                      APPLICATION_COLORS,
                    )}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("charts.reportsByStatus")}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading || !stats ? (
                <Skeleton className="h-60 w-full" />
              ) : (
                <StatusBarChart
                  data={bars(
                    [
                      ["PENDING", stats.pendingReportsCount],
                      ["REVIEWED", stats.reviewedReportsCount],
                      ["ACTION_TAKEN", stats.actionTakenReportsCount],
                    ],
                    REPORT_STATUS_COLORS,
                  )}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("memberships.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading || !stats ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : (
                <>
                  <MembershipRow
                    label={t("memberships.pending")}
                    value={stats.pendingClubMembershipsCount}
                  />
                  <MembershipRow
                    label={t("memberships.active")}
                    value={stats.activeClubMembershipsCount}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MembershipRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-foreground-muted">{label}</span>
      <span className="text-lg font-semibold">{value.toLocaleString()}</span>
    </div>
  );
}
