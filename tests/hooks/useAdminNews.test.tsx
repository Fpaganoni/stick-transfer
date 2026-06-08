/**
 * What: Unit tests for the admin News CMS hooks (list query + CRUD/publish mutations).
 * Why: Verifies the query forwards filters/pagination, and each mutation calls
 *      the GraphQL client with the variable shape the backend contract expects
 *      (id/input split for create vs update, bare id for delete/publish/unpublish).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useSuperAdminNews,
  useCreateNewsArticle,
  useUpdateNewsArticle,
  useDeleteNewsArticle,
  usePublishNewsArticle,
  useUnpublishNewsArticle,
} from "@/hooks/useAdminNews";

const mockRequest = vi.fn();
vi.mock("@/lib/graphql-client", () => ({
  graphqlClient: { request: (...args: unknown[]) => mockRequest(...args) },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockArticle = {
  id: "article-1",
  title: "Test Article",
  slug: "test-article",
  excerpt: "Excerpt",
  content: "Content",
  category: "TRANSFERS" as const,
  isPublished: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const mockInput = {
  title: "Test Article",
  slug: "test-article",
  excerpt: "Excerpt",
  content: "Content",
  category: "TRANSFERS" as const,
};

function wrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

describe("useSuperAdminNews", () => {
  beforeEach(() => mockRequest.mockReset());

  it("fetches articles with filters and pagination variables", async () => {
    mockRequest.mockResolvedValueOnce({
      superAdminNewsArticles: { items: [mockArticle], total: 1, hasMore: false },
    });

    const { result } = renderHook(() => useSuperAdminNews({ search: "test" }, 1, 20), {
      wrapper: wrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.superAdminNewsArticles.items).toHaveLength(1);
    expect(mockRequest).toHaveBeenCalledWith(expect.anything(), {
      filters: { search: "test" },
      page: 1,
      limit: 20,
    });
  });
});

describe("useCreateNewsArticle", () => {
  beforeEach(() => mockRequest.mockReset());

  it("mutates with the article input", async () => {
    mockRequest.mockResolvedValueOnce({ createNewsArticle: mockArticle });

    const { result } = renderHook(() => useCreateNewsArticle(), { wrapper: wrapper() });
    result.current.mutate(mockInput);

    await waitFor(() => expect(mockRequest).toHaveBeenCalled());
    expect(mockRequest).toHaveBeenCalledWith(expect.anything(), { input: mockInput });
  });
});

describe("useUpdateNewsArticle", () => {
  beforeEach(() => mockRequest.mockReset());

  it("mutates with id and input", async () => {
    mockRequest.mockResolvedValueOnce({ updateNewsArticle: mockArticle });

    const { result } = renderHook(() => useUpdateNewsArticle(), { wrapper: wrapper() });
    result.current.mutate({ id: "article-1", input: mockInput });

    await waitFor(() => expect(mockRequest).toHaveBeenCalled());
    expect(mockRequest).toHaveBeenCalledWith(expect.anything(), {
      id: "article-1",
      input: mockInput,
    });
  });
});

describe("useDeleteNewsArticle", () => {
  beforeEach(() => mockRequest.mockReset());

  it("mutates with the article id", async () => {
    mockRequest.mockResolvedValueOnce({ deleteNewsArticle: { id: "article-1" } });

    const { result } = renderHook(() => useDeleteNewsArticle(), { wrapper: wrapper() });
    result.current.mutate({ id: "article-1" });

    await waitFor(() => expect(mockRequest).toHaveBeenCalled());
    expect(mockRequest).toHaveBeenCalledWith(expect.anything(), { id: "article-1" });
  });
});

describe("usePublishNewsArticle / useUnpublishNewsArticle", () => {
  beforeEach(() => mockRequest.mockReset());

  it("publish mutates with the article id", async () => {
    mockRequest.mockResolvedValueOnce({ publishNewsArticle: { ...mockArticle, isPublished: true } });

    const { result } = renderHook(() => usePublishNewsArticle(), { wrapper: wrapper() });
    result.current.mutate({ id: "article-1" });

    await waitFor(() => expect(mockRequest).toHaveBeenCalled());
    expect(mockRequest).toHaveBeenCalledWith(expect.anything(), { id: "article-1" });
  });

  it("unpublish mutates with the article id", async () => {
    mockRequest.mockResolvedValueOnce({ unpublishNewsArticle: { ...mockArticle, isPublished: false } });

    const { result } = renderHook(() => useUnpublishNewsArticle(), { wrapper: wrapper() });
    result.current.mutate({ id: "article-1" });

    await waitFor(() => expect(mockRequest).toHaveBeenCalled());
    expect(mockRequest).toHaveBeenCalledWith(expect.anything(), { id: "article-1" });
  });
});
