import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NewsCard } from "@/components/news/news-card";
import type { NewsArticleSummary } from "@/hooks/useNews";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key.split(".").pop() ?? key,
  useLocale: () => "en",
}));

vi.mock("@/lib/date-utils", () => ({
  formatDate: () => "June 3, 2026",
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ""} />
  ),
}));

const mockArticle: NewsArticleSummary = {
  id: "1",
  slug: "test-article",
  title: "FIH Pro League Preview 2026",
  excerpt: "Everything you need to know about the upcoming season.",
  coverImage: "https://example.com/cover.jpg",
  category: "INTERNATIONAL",
  publishedAt: "2026-06-03T10:00:00Z",
  readingTimeMinutes: 5,
  author: { name: "Test Author", avatar: "" },
};

describe("NewsCard", () => {
  it("renders without errors", () => {
    const { container } = render(<NewsCard article={mockArticle} />);
    expect(container.firstChild).not.toBeNull();
  });

  it("renders article title", () => {
    render(<NewsCard article={mockArticle} />);
    expect(screen.getByText("FIH Pro League Preview 2026")).toBeInTheDocument();
  });

  it("renders category badge", () => {
    render(<NewsCard article={mockArticle} />);
    expect(screen.getByText("international")).toBeInTheDocument();
  });

  it("renders formatted date", () => {
    render(<NewsCard article={mockArticle} />);
    expect(screen.getByText("June 3, 2026")).toBeInTheDocument();
  });

  it("renders reading time", () => {
    render(<NewsCard article={mockArticle} />);
    expect(screen.getByText(/5/)).toBeInTheDocument();
  });

  it("links to correct slug", () => {
    render(<NewsCard article={mockArticle} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", expect.stringContaining("test-article"));
  });
});
