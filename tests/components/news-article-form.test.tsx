/**
 * What: Unit tests for NewsArticleForm (create mode).
 * Why: Validates the zod schema surfaces field errors on an empty submit, the
 *      title→slug auto-slugify behavior fires while the slug is untouched, and
 *      a valid submit calls the create mutation with the expected input shape.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewsArticleForm } from "@/components/admin/news/news-article-form";

const { mockPush, mockCreateMutateAsync } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockCreateMutateAsync: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("@/hooks/useAdminNews", () => ({
  useCreateNewsArticle: () => ({ mutateAsync: mockCreateMutateAsync, isPending: false }),
  useUpdateNewsArticle: () => ({ mutateAsync: vi.fn(), isPending: false }),
  usePublishNewsArticle: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSuperAdminNews: () => ({ data: { superAdminNewsArticles: { items: [], total: 0, hasMore: false } } }),
}));

describe("NewsArticleForm (create mode)", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockCreateMutateAsync.mockReset();
  });

  it("shows validation errors when submitting an empty form", async () => {
    const user = userEvent.setup();
    render(<NewsArticleForm mode="create" />);

    await user.click(screen.getByRole("button", { name: "form.saveDraft" }));

    await waitFor(() => {
      expect(screen.getByText("form.validation.titleMin")).toBeInTheDocument();
    });
    expect(screen.getByText("form.validation.contentMin")).toBeInTheDocument();
    expect(mockCreateMutateAsync).not.toHaveBeenCalled();
  });

  it("auto-generates the slug from the title while untouched", async () => {
    const user = userEvent.setup();
    render(<NewsArticleForm mode="create" />);

    const titleInput = screen.getByLabelText("form.title");
    await user.type(titleInput, "Hockey World Cup Final");

    const slugInput = screen.getByLabelText("form.slug") as HTMLInputElement;
    await waitFor(() => expect(slugInput.value).toBe("hockey-world-cup-final"));
  });

  it("submits valid input to the create mutation and redirects to the list", async () => {
    mockCreateMutateAsync.mockResolvedValue({ createNewsArticle: { id: "article-1" } });
    const user = userEvent.setup();
    render(<NewsArticleForm mode="create" />);

    await user.type(screen.getByLabelText("form.title"), "Hockey World Cup Final");
    await user.type(
      screen.getByLabelText("form.excerpt"),
      "A thrilling final between two top sides."
    );
    await user.type(
      screen.getByLabelText("form.content"),
      "The match went to a penalty shootout after a 2-2 draw in regulation time."
    );

    await user.click(screen.getByRole("button", { name: "form.saveDraft" }));

    await waitFor(() => expect(mockCreateMutateAsync).toHaveBeenCalledTimes(1));
    expect(mockCreateMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Hockey World Cup Final",
        slug: "hockey-world-cup-final",
        category: "NATIONAL",
      })
    );
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/admin/news"));
  }, 15000);
});
