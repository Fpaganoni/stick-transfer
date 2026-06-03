import { useQuery } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import { GET_NEWS, GET_NEWS_ARTICLE } from "@/graphql/news/queries";

export type NewsCategory =
  | "INTERNATIONAL"
  | "NATIONAL"
  | "TRANSFERS"
  | "EQUIPMENT"
  | "RESULTS";

export interface NewsAuthor {
  name: string;
  avatar?: string;
}

export interface NewsArticleSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  category: NewsCategory;
  publishedAt: string;
  readingTimeMinutes: number;
  author: NewsAuthor;
}

export interface NewsArticleDetail extends Omit<NewsArticleSummary, "excerpt"> {
  content: string;
  relatedArticles: Omit<NewsArticleSummary, "excerpt" | "readingTimeMinutes" | "author">[];
}

export interface NewsFiltersInput {
  category?: NewsCategory;
}

interface NewsListResponse {
  news: {
    items: NewsArticleSummary[];
    total: number;
    hasMore: boolean;
  };
}

interface NewsArticleResponse {
  newsArticle: NewsArticleDetail;
}

const MOCK_ARTICLES: NewsArticleSummary[] = [
  {
    id: "1",
    slug: "fih-pro-league-2026-preview",
    title: "FIH Pro League 2026: Everything You Need to Know",
    excerpt:
      "The FIH Pro League enters a new era with expanded nations, revised formats, and top clubs battling for global supremacy on the world stage.",
    coverImage: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&q=80",
    category: "INTERNATIONAL",
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    readingTimeMinutes: 5,
    author: { name: "Alex Morgan", avatar: "" },
  },
  {
    id: "2",
    slug: "netherlands-hockey-dominance-2026",
    title: "Netherlands Continue to Dominate European Hockey",
    excerpt:
      "Dutch clubs set the pace again in the EHL quarterfinals, with HC Rotterdam and Amsterdam both progressing to the Final Four.",
    coverImage: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80",
    category: "NATIONAL",
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    readingTimeMinutes: 4,
    author: { name: "Johan de Boer", avatar: "" },
  },
  {
    id: "3",
    slug: "top-transfers-summer-2026",
    title: "Summer 2026: The Biggest Hockey Transfers So Far",
    excerpt:
      "From Belgium to Australia — this summer's transfer window is heating up with marquee signings reshaping top club rosters worldwide.",
    coverImage: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&q=80",
    category: "TRANSFERS",
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    readingTimeMinutes: 6,
    author: { name: "Sarah Chen", avatar: "" },
  },
  {
    id: "4",
    slug: "adidas-hockey-stick-2026",
    title: "Adidas Launches Next-Gen Hockey Stick Line for 2026",
    excerpt:
      "Adidas unveils its most advanced hockey stick collection yet, featuring carbon-fiber composites and sensor-ready grip technology.",
    coverImage: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80",
    category: "EQUIPMENT",
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    readingTimeMinutes: 3,
    author: { name: "Marco Visser", avatar: "" },
  },
  {
    id: "5",
    slug: "ehl-quarterfinals-results",
    title: "EHL Quarterfinals: Shock Upsets and Dominant Wins",
    excerpt:
      "Surprise eliminations rocked the EHL quarterfinals as underdogs from Spain and Belgium stunned heavily favoured opponents.",
    coverImage: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80",
    category: "RESULTS",
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    readingTimeMinutes: 4,
    author: { name: "Pierre Dubois", avatar: "" },
  },
  {
    id: "6",
    slug: "argentina-hockey-rising",
    title: "Argentina's Hockey Scene Is on the Rise",
    excerpt:
      "New investment in youth academies and domestic leagues is turning Argentina into a serious hockey powerhouse for the next decade.",
    coverImage: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&q=80",
    category: "NATIONAL",
    publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    readingTimeMinutes: 5,
    author: { name: "Carlos Mendez", avatar: "" },
  },
];

export function useNewsQuery(filters?: NewsFiltersInput, page = 1) {
  return useQuery<NewsListResponse>({
    queryKey: ["news", filters, page],
    queryFn: async () => {
      try {
        return await graphqlClient.request<NewsListResponse>(GET_NEWS, {
          filters,
          page,
          limit: 12,
        });
      } catch {
        const items = filters?.category
          ? MOCK_ARTICLES.filter((a) => a.category === filters.category)
          : MOCK_ARTICLES;
        return {
          news: {
            items,
            total: items.length,
            hasMore: false,
          },
        };
      }
    },
    staleTime: 60_000,
  });
}

export function useNewsArticleQuery(slug: string) {
  return useQuery<NewsArticleResponse>({
    queryKey: ["news", "article", slug],
    queryFn: async () => {
      try {
        return await graphqlClient.request<NewsArticleResponse>(GET_NEWS_ARTICLE, { slug });
      } catch {
        const found = MOCK_ARTICLES.find((a) => a.slug === slug);
        const article: NewsArticleDetail = {
          id: found?.id ?? "1",
          slug: found?.slug ?? slug,
          title: found?.title ?? "Article Not Found",
          content: found
            ? `<p>${found.excerpt}</p><p>Full article content coming soon. Stay tuned for the latest hockey news and updates from around the world.</p>`
            : "<p>Article not found.</p>",
          coverImage: found?.coverImage ?? "",
          category: found?.category ?? "INTERNATIONAL",
          publishedAt: found?.publishedAt ?? new Date().toISOString(),
          readingTimeMinutes: found?.readingTimeMinutes ?? 3,
          author: found?.author ?? { name: "Editorial Team", avatar: "" },
          relatedArticles: MOCK_ARTICLES.filter((a) => a.slug !== slug)
            .slice(0, 3)
            .map(({ id, slug, title, coverImage, category, publishedAt }) => ({
              id,
              slug,
              title,
              coverImage,
              category,
              publishedAt,
            })),
        };
        return { newsArticle: article };
      }
    },
    staleTime: 60_000,
    enabled: !!slug,
  });
}
