"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { useAdminJobApplications, useAdminJobOpportunities } from "@/hooks/useAdminJobs";
import { AdminJobOpportunitiesTable } from "@/components/admin/jobs/admin-job-opportunities-table";
import { AdminJobApplicationsTable } from "@/components/admin/jobs/admin-job-applications-table";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminApplicationFilters, AdminJobFilters } from "@/types/models/admin";

const PAGE_SIZE = 20;

const OPPORTUNITY_STATUS_VALUES = ["ALL", "OPEN", "CLOSED", "FILLED"] as const;
const APPLICATION_STATUS_VALUES = ["ALL", "PENDING", "UNDER_REVIEW", "ACCEPTED", "REJECTED", "WITHDRAWN"] as const;

export default function AdminJobsPage() {
  const t = useTranslations("admin.jobs");
  const [tab, setTab] = useState<"opportunities" | "applications">("opportunities");

  // Opportunities filters
  const [oppSearchInput, setOppSearchInput] = useState("");
  const [oppSearch, setOppSearch] = useState("");
  const [oppStatus, setOppStatus] = useState<(typeof OPPORTUNITY_STATUS_VALUES)[number]>("ALL");
  const [oppPage, setOppPage] = useState(1);

  // Applications filters
  const [appSearchInput, setAppSearchInput] = useState("");
  const [appSearch, setAppSearch] = useState("");
  const [appStatus, setAppStatus] = useState<(typeof APPLICATION_STATUS_VALUES)[number]>("ALL");
  const [appPage, setAppPage] = useState(1);

  useEffect(() => {
    const handle = setTimeout(() => {
      setOppSearch(oppSearchInput.trim());
      setOppPage(1);
    }, 400);
    return () => clearTimeout(handle);
  }, [oppSearchInput]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setAppSearch(appSearchInput.trim());
      setAppPage(1);
    }, 400);
    return () => clearTimeout(handle);
  }, [appSearchInput]);

  const oppFilters: AdminJobFilters = useMemo(() => {
    const f: AdminJobFilters = {};
    if (oppSearch) f.search = oppSearch;
    if (oppStatus !== "ALL") f.status = oppStatus;
    return f;
  }, [oppSearch, oppStatus]);

  const appFilters: AdminApplicationFilters = useMemo(() => {
    const f: AdminApplicationFilters = {};
    if (appSearch) f.search = appSearch;
    if (appStatus !== "ALL") f.status = appStatus;
    return f;
  }, [appSearch, appStatus]);

  const opportunitiesQuery = useAdminJobOpportunities(oppFilters, oppPage, PAGE_SIZE);
  const applicationsQuery = useAdminJobApplications(appFilters, appPage, PAGE_SIZE);

  const opportunities = opportunitiesQuery.data?.adminJobOpportunities.items ?? [];
  const opportunitiesTotal = opportunitiesQuery.data?.adminJobOpportunities.total ?? 0;

  const applications = applicationsQuery.data?.adminJobApplications.items ?? [];
  const applicationsTotal = applicationsQuery.data?.adminJobApplications.total ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-foreground-muted">{t("subtitle")}</p>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as "opportunities" | "applications")}>
        <TabsList>
          <TabsTrigger value="opportunities">{t("tabs.opportunities")}</TabsTrigger>
          <TabsTrigger value="applications">{t("tabs.applications")}</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="space-y-6">
          <Card>
            <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:flex-wrap">
              <div className="relative flex-1 sm:min-w-[220px]">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground-muted" />
                <Input
                  value={oppSearchInput}
                  onChange={(e) => setOppSearchInput(e.target.value)}
                  placeholder={t("opportunities.filters.searchPlaceholder")}
                  className="pl-9"
                />
              </div>
              <Select
                value={oppStatus}
                onValueChange={(value) => {
                  setOppStatus(value as (typeof OPPORTUNITY_STATUS_VALUES)[number]);
                  setOppPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder={t("opportunities.filters.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t("opportunities.filters.allStatuses")}</SelectItem>
                  {OPPORTUNITY_STATUS_VALUES.filter((s) => s !== "ALL").map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`opportunities.status.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <AdminJobOpportunitiesTable opportunities={opportunities} isLoading={opportunitiesQuery.isLoading} />
          <AdminPagination page={oppPage} total={opportunitiesTotal} limit={PAGE_SIZE} onPageChange={setOppPage} />
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          <Card>
            <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:flex-wrap">
              <div className="relative flex-1 sm:min-w-[220px]">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground-muted" />
                <Input
                  value={appSearchInput}
                  onChange={(e) => setAppSearchInput(e.target.value)}
                  placeholder={t("applications.filters.searchPlaceholder")}
                  className="pl-9"
                />
              </div>
              <Select
                value={appStatus}
                onValueChange={(value) => {
                  setAppStatus(value as (typeof APPLICATION_STATUS_VALUES)[number]);
                  setAppPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder={t("applications.filters.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t("applications.filters.allStatuses")}</SelectItem>
                  {APPLICATION_STATUS_VALUES.filter((s) => s !== "ALL").map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`applications.status.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <AdminJobApplicationsTable applications={applications} isLoading={applicationsQuery.isLoading} />
          <AdminPagination page={appPage} total={applicationsTotal} limit={PAGE_SIZE} onPageChange={setAppPage} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
