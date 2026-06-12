"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { useAdminJobOpportunities } from "@/hooks/useAdminJobs";
import { AdminJobOpportunitiesTable } from "@/components/admin/jobs/admin-job-opportunities-table";
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
import { AdminJobFilters } from "@/types/models/admin";

const PAGE_SIZE = 20;

const OPPORTUNITY_STATUS_VALUES = ["ALL", "OPEN", "CLOSED", "FILLED"] as const;

export default function AdminJobsPage() {
  const t = useTranslations("admin.jobs");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof OPPORTUNITY_STATUS_VALUES)[number]>("ALL");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const filters: AdminJobFilters = useMemo(() => {
    const f: AdminJobFilters = {};
    if (search) f.search = search;
    if (status !== "ALL") f.status = status;
    return f;
  }, [search, status]);

  const { data, isLoading } = useAdminJobOpportunities(filters, page, PAGE_SIZE);
  const items = data?.jobOpportunities ?? [];
  // GAP backend: jobOpportunities no devuelve total/hasMore. Heurística: si la
  // página vino completa, asumimos que hay al menos una página más (igual que
  // /admin/reports).
  const total = (page - 1) * PAGE_SIZE + items.length + (items.length === PAGE_SIZE ? 1 : 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-foreground-muted">{t("subtitle")}</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:flex-wrap">
          <div className="relative flex-1 sm:min-w-[220px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground-muted" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("opportunities.filters.searchPlaceholder")}
              className="pl-9"
            />
          </div>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as (typeof OPPORTUNITY_STATUS_VALUES)[number]);
              setPage(1);
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

      <AdminJobOpportunitiesTable opportunities={items} isLoading={isLoading} />
      <AdminPagination page={page} total={total} limit={PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
}
