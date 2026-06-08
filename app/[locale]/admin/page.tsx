"use client";

import { useTranslations } from "next-intl";
import {
  Users,
  Building2,
  Briefcase,
  Newspaper,
  RefreshCw,
  Heart,
  Repeat2,
  MessageCircle,
  Mail,
} from "lucide-react";
import { useAdminStats } from "@/hooks/useAdminStats";
import { StatCard } from "@/components/admin/stat-card";
import { UsersGrowthChart } from "@/components/admin/charts/users-growth-chart";
import { RoleDistributionChart } from "@/components/admin/charts/role-distribution-chart";
import {
  StatusBarChart,
  StatusBarDatum,
} from "@/components/admin/charts/status-bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
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

const APPLICATION_COLORS: Record<string, string> = {
  PENDING: "var(--warning)",
  UNDER_REVIEW: "var(--info)",
  ACCEPTED: "var(--success)",
  REJECTED: "var(--error)",
  WITHDRAWN: "var(--foreground-muted)",
};

const NEWS_CATEGORY_COLORS: Record<string, string> = {
  INTERNATIONAL: "var(--info)",
  NATIONAL: "var(--accent)",
  TRANSFERS: "var(--primary)",
  EQUIPMENT: "var(--warning)",
  RESULTS: "var(--success)",
};

function toBars<T extends { count: number }>(
  items: T[],
  keyOf: (item: T) => string,
  colors: Record<string, string>,
): StatusBarDatum[] {
  return items.map((item) => {
    const label = keyOf(item);
    return {
      label,
      value: item.count,
      color: colors[label] ?? "var(--foreground-muted)",
    };
  });
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

  const totalCountryUsers =
    stats?.users.byCountry.reduce((acc, c) => acc + c.count, 0) ?? 0;
  const totalLeagueClubs =
    stats?.clubs.byLeague.reduce((acc, l) => acc + l.count, 0) ?? 0;

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
          value={stats?.users.total}
          icon={Users}
          delta={
            stats
              ? t("stats.newInLast30Days", { count: stats.users.newLast30Days })
              : undefined
          }
          isLoading={isLoading}
        />
        <StatCard
          label={t("stats.totalClubs")}
          value={stats?.clubs.total}
          icon={Building2}
          delta={
            stats
              ? t("stats.newInLast30Days", { count: stats.clubs.newLast30Days })
              : undefined
          }
          iconClassName="bg-accent/10 text-accent"
          isLoading={isLoading}
        />
        <StatCard
          label={t("stats.openJobs")}
          value={
            stats
              ? `${stats.jobs.byStatus.find((s) => s.status === "OPEN")?.count ?? 0} / ${stats.jobs.totalOpportunities}`
              : undefined
          }
          icon={Briefcase}
          iconClassName="bg-info/10 text-info"
          isLoading={isLoading}
        />
        <StatCard
          label={t("stats.publishedNews")}
          value={
            stats ? `${stats.news.published} / ${stats.news.total}` : undefined
          }
          icon={Newspaper}
          iconClassName="bg-warning/10 text-warning"
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Charts */}
          <Card>
            <CardHeader>
              <CardTitle>{t("charts.usersGrowth")}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading || !stats ? (
                <Skeleton className="h-[260px] w-full" />
              ) : (
                <UsersGrowthChart data={stats.users.growth} />
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("charts.usersByRole")}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading || !stats ? (
                  <Skeleton className="h-[260px] w-full" />
                ) : (
                  <RoleDistributionChart data={stats.users.byRole} />
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
                    data={toBars(
                      stats.clubs.byVerificationStatus,
                      (i) => i.status,
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
                <CardTitle>{t("charts.applicationsByStatus")}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading || !stats ? (
                  <Skeleton className="h-60 w-full" />
                ) : (
                  <StatusBarChart
                    data={toBars(
                      stats.jobs.applicationsByStatus,
                      (i) => (i as { status: string }).status,
                      APPLICATION_COLORS,
                    )}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("charts.newsByCategory")}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading || !stats ? (
                  <Skeleton className="h-60 w-full" />
                ) : (
                  <StatusBarChart
                    data={toBars(
                      stats.news.byCategory,
                      (i) => (i as { category: string }).category,
                      NEWS_CATEGORY_COLORS,
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
              <CardTitle>{t("social.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading || !stats ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : (
                <>
                  <SocialMiniStat
                    icon={Repeat2}
                    label={t("social.follows")}
                    value={stats.social.totalFollows}
                  />
                  <SocialMiniStat
                    icon={Heart}
                    label={t("social.likes")}
                    value={stats.social.totalLikes}
                  />
                  <SocialMiniStat
                    icon={MessageCircle}
                    label={t("social.conversations")}
                    value={stats.social.totalConversations}
                  />
                  <SocialMiniStat
                    icon={Mail}
                    label={t("social.messages")}
                    value={stats.social.totalMessages}
                  />
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("topCountries.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading || !stats ? (
                <Skeleton className="h-40 w-full" />
              ) : stats.users.byCountry.length === 0 ? (
                <p className="text-sm text-foreground-muted">
                  {t("topCountries.empty")}
                </p>
              ) : (
                stats.users.byCountry.map((entry) => (
                  <RankedListRow
                    key={entry.country}
                    label={entry.country}
                    value={entry.count}
                    percentage={
                      totalCountryUsers
                        ? (entry.count / totalCountryUsers) * 100
                        : 0
                    }
                  />
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("topLeagues.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading || !stats ? (
                <Skeleton className="h-40 w-full" />
              ) : stats.clubs.byLeague.length === 0 ? (
                <p className="text-sm text-foreground-muted">
                  {t("topLeagues.empty")}
                </p>
              ) : (
                stats.clubs.byLeague.map((entry) => (
                  <RankedListRow
                    key={entry.league}
                    label={entry.league}
                    value={entry.count}
                    percentage={
                      totalLeagueClubs
                        ? (entry.count / totalLeagueClubs) * 100
                        : 0
                    }
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SocialMiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Heart;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground-muted">
        <Icon className="size-4" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-foreground-muted">{label}</p>
      </div>
      <p className="text-lg font-semibold">{value.toLocaleString()}</p>
    </div>
  );
}

function RankedListRow({
  label,
  value,
  percentage,
}: {
  label: string;
  value: number;
  percentage: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-foreground-muted">{value.toLocaleString()}</span>
      </div>
      <Progress value={percentage} className="h-1.5" />
    </div>
  );
}
