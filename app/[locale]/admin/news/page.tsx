"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Search } from "lucide-react";
import { useSuperAdminNews } from "@/hooks/useAdminNews";
import { AdminNewsTable } from "@/components/admin/news/admin-news-table";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { SuperAdminNewsFilters } from "@/types/models/admin";
import { NewsCategory } from "@/hooks/useNews";

const PAGE_SIZE = 20;

const CATEGORY_VALUES = ["ALL", "INTERNATIONAL", "NATIONAL", "TRANSFERS", "EQUIPMENT", "RESULTS"] as const;
type StatusFilterValue = "ALL" | "PUBLISHED" | "DRAFT";

export default function AdminNewsPage() {
  const t = useTranslations("admin.news");
  const locale = useLocale();
  const localePrefix = locale === "en" ? "" : `/${locale}`;

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORY_VALUES)[number]>("ALL");
  const [status, setStatus] = useState<StatusFilterValue>("ALL");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const filters: SuperAdminNewsFilters = useMemo(() => {
    const f: SuperAdminNewsFilters = {};
    if (search) f.search = search;
    if (category !== "ALL") f.category = category as NewsCategory;
    if (status !== "ALL") f.isPublished = status === "PUBLISHED";
    return f;
  }, [search, category, status]);

  const { data, isLoading } = useSuperAdminNews(filters, page, PAGE_SIZE);
  const items = data?.superAdminNewsArticles.items ?? [];
  const total = data?.superAdminNewsArticles.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-foreground-muted">{t("subtitle")}</p>
        </div>
        <Button asChild>
          <Link href={`${localePrefix}/admin/news/new`}>
            <Plus className="size-4" />
            {t("newArticle")}
          </Link>
        </Button>
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
            value={category}
            onValueChange={(value) => {
              setCategory(value as (typeof CATEGORY_VALUES)[number]);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t("filters.category")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("filters.allCategories")}</SelectItem>
              {CATEGORY_VALUES.filter((c) => c !== "ALL").map((c) => (
                <SelectItem key={c} value={c}>
                  {t(`categories.${c}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as StatusFilterValue);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t("filters.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("filters.allStatuses")}</SelectItem>
              <SelectItem value="PUBLISHED">{t("status.published")}</SelectItem>
              <SelectItem value="DRAFT">{t("status.draft")}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <AdminNewsTable articles={items} isLoading={isLoading} localePrefix={localePrefix} />

      <AdminPagination page={page} total={total} limit={PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
}
