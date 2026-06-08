"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { AdminUsersTable } from "@/components/admin/users/admin-users-table";
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
import { AdminUserFilters } from "@/types/models/admin";
import { Role } from "@/types/enums";

const PAGE_SIZE = 20;

const ROLE_FILTER_VALUES = ["ALL", Role.PLAYER, Role.COACH, Role.CLUB, Role.SUPERADMIN] as const;

type RoleFilterValue = (typeof ROLE_FILTER_VALUES)[number];
type BoolFilterValue = "ALL" | "true" | "false";

export default function AdminUsersPage() {
  const t = useTranslations("admin.users");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<RoleFilterValue>("ALL");
  const [active, setActive] = useState<BoolFilterValue>("ALL");
  const [verified, setVerified] = useState<BoolFilterValue>("ALL");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const filters: AdminUserFilters = useMemo(() => {
    const f: AdminUserFilters = {};
    if (search) f.search = search;
    if (role !== "ALL") f.role = role;
    if (active !== "ALL") f.isActive = active === "true";
    if (verified !== "ALL") f.isVerified = verified === "true";
    return f;
  }, [search, role, active, verified]);

  const { data, isLoading } = useAdminUsers(filters, page, PAGE_SIZE);
  const items = data?.adminUsers.items ?? [];
  const total = data?.adminUsers.total ?? 0;

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
            value={role}
            onValueChange={(value) => {
              setRole(value as RoleFilterValue);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder={t("filters.role")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("filters.allRoles")}</SelectItem>
              {ROLE_FILTER_VALUES.filter((r) => r !== "ALL").map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={active}
            onValueChange={(value) => {
              setActive(value as BoolFilterValue);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder={t("filters.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("filters.allStatuses")}</SelectItem>
              <SelectItem value="true">{t("status.active")}</SelectItem>
              <SelectItem value="false">{t("status.inactive")}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={verified}
            onValueChange={(value) => {
              setVerified(value as BoolFilterValue);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder={t("filters.verification")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("filters.allVerifications")}</SelectItem>
              <SelectItem value="true">{t("filters.verified")}</SelectItem>
              <SelectItem value="false">{t("filters.unverified")}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <AdminUsersTable users={items} isLoading={isLoading} />

      <AdminPagination page={page} total={total} limit={PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
}
