"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { useAdminClubs } from "@/hooks/useAdminClubs";
import { AdminClubsTable } from "@/components/admin/clubs/admin-clubs-table";
import { ClubVerificationDialog } from "@/components/admin/clubs/club-verification-dialog";
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
import { AdminClubFilters, AdminClubRow, ClubVerificationStatus } from "@/types/models/admin";

const PAGE_SIZE = 20;

const STATUS_FILTER_VALUES = ["ALL", "UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"] as const;
type StatusFilterValue = (typeof STATUS_FILTER_VALUES)[number];

export default function AdminClubsPage() {
  const t = useTranslations("admin.clubs");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilterValue>("ALL");
  const [page, setPage] = useState(1);
  const [reviewClub, setReviewClub] = useState<AdminClubRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const filters: AdminClubFilters = useMemo(() => {
    const f: AdminClubFilters = {};
    if (search) f.search = search;
    if (status !== "ALL") f.verificationStatus = status as ClubVerificationStatus;
    return f;
  }, [search, status]);

  const { data, isLoading } = useAdminClubs(filters, page, PAGE_SIZE);
  const items = data?.adminClubs.items ?? [];
  const total = data?.adminClubs.total ?? 0;
  const pendingCount = items.filter((c) => c.verificationStatus === "PENDING").length;

  const openReview = (club: AdminClubRow) => {
    setReviewClub(club);
    setDialogOpen(true);
  };

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
              placeholder={t("filters.searchPlaceholder")}
              className="pl-9"
            />
          </div>

          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as StatusFilterValue);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder={t("filters.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("filters.allStatuses")}</SelectItem>
              {STATUS_FILTER_VALUES.filter((s) => s !== "ALL").map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`verificationStatus.${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {pendingCount > 0 && (
            <span className="rounded-full bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
              {t("filters.pendingCount", { count: pendingCount })}
            </span>
          )}
        </CardContent>
      </Card>

      <AdminClubsTable clubs={items} isLoading={isLoading} onReview={openReview} />

      <AdminPagination page={page} total={total} limit={PAGE_SIZE} onPageChange={setPage} />

      <ClubVerificationDialog club={reviewClub} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
