import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import {
  SUPER_ADMIN_NEWS_ARTICLES,
  CREATE_NEWS_ARTICLE,
  UPDATE_NEWS_ARTICLE,
  DELETE_NEWS_ARTICLE,
  PUBLISH_NEWS_ARTICLE,
  UNPUBLISH_NEWS_ARTICLE,
} from "@/graphql";
import {
  AdminNewsArticle,
  NewsArticleInput,
  SuperAdminNewsFilters,
  SuperAdminNewsResponse,
} from "@/types/models/admin";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

const ADMIN_NEWS_KEY = ["admin", "news"] as const;

export function useSuperAdminNews(filters?: SuperAdminNewsFilters, page = 1, limit = 20) {
  return useQuery<SuperAdminNewsResponse>({
    queryKey: [...ADMIN_NEWS_KEY, filters, page],
    queryFn: async () =>
      graphqlClient.request<SuperAdminNewsResponse>(SUPER_ADMIN_NEWS_ARTICLES, {
        filters,
        page,
        limit,
      }),
    staleTime: 60_000,
  });
}

function useInvalidateAdminNews() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ADMIN_NEWS_KEY });
}

export function useCreateNewsArticle() {
  const invalidate = useInvalidateAdminNews();
  const t = useTranslations("admin.news");

  return useMutation<{ createNewsArticle: AdminNewsArticle }, Error, NewsArticleInput>({
    mutationFn: async (input) => graphqlClient.request(CREATE_NEWS_ARTICLE, { input }),
    onSuccess: () => {
      invalidate();
      toast.success(t("toasts.created"));
    },
    onError: (error) => {
      toast.error(t("toasts.actionFailed"), { description: error.message });
    },
  });
}

export function useUpdateNewsArticle() {
  const invalidate = useInvalidateAdminNews();
  const t = useTranslations("admin.news");

  return useMutation<
    { updateNewsArticle: AdminNewsArticle },
    Error,
    { id: string; input: NewsArticleInput }
  >({
    mutationFn: async ({ id, input }) =>
      graphqlClient.request(UPDATE_NEWS_ARTICLE, { id, input }),
    onSuccess: () => {
      invalidate();
      toast.success(t("toasts.updated"));
    },
    onError: (error) => {
      toast.error(t("toasts.actionFailed"), { description: error.message });
    },
  });
}

export function useDeleteNewsArticle() {
  const invalidate = useInvalidateAdminNews();
  const t = useTranslations("admin.news");

  return useMutation<{ deleteNewsArticle: { id: string } }, Error, { id: string }>({
    mutationFn: async ({ id }) => graphqlClient.request(DELETE_NEWS_ARTICLE, { id }),
    onSuccess: () => {
      invalidate();
      toast.success(t("toasts.deleted"));
    },
    onError: (error) => {
      toast.error(t("toasts.actionFailed"), { description: error.message });
    },
  });
}

export function usePublishNewsArticle() {
  const invalidate = useInvalidateAdminNews();
  const t = useTranslations("admin.news");

  return useMutation<{ publishNewsArticle: AdminNewsArticle }, Error, { id: string }>({
    mutationFn: async ({ id }) => graphqlClient.request(PUBLISH_NEWS_ARTICLE, { id }),
    onSuccess: () => {
      invalidate();
      toast.success(t("toasts.published"));
    },
    onError: (error) => {
      toast.error(t("toasts.actionFailed"), { description: error.message });
    },
  });
}

export function useUnpublishNewsArticle() {
  const invalidate = useInvalidateAdminNews();
  const t = useTranslations("admin.news");

  return useMutation<{ unpublishNewsArticle: AdminNewsArticle }, Error, { id: string }>({
    mutationFn: async ({ id }) => graphqlClient.request(UNPUBLISH_NEWS_ARTICLE, { id }),
    onSuccess: () => {
      invalidate();
      toast.success(t("toasts.unpublished"));
    },
    onError: (error) => {
      toast.error(t("toasts.actionFailed"), { description: error.message });
    },
  });
}
