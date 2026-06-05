import { gql } from "graphql-request";

export const GET_NEWS = gql`
  query GetNews($filters: NewsFiltersInput, $page: Int, $limit: Int) {
    news(filters: $filters, page: $page, limit: $limit) {
      items {
        id
        slug
        title
        excerpt
        coverImage
        category
        publishedAt
        readingTimeMinutes
        author {
          name
          avatar
        }
      }
      total
      hasMore
    }
  }
`;

export const GET_NEWS_ARTICLE = gql`
  query GetNewsArticle($slug: String!) {
    newsArticle(slug: $slug) {
      id
      slug
      title
      content
      coverImage
      category
      publishedAt
      readingTimeMinutes
      author {
        name
        avatar
      }
      relatedArticles {
        id
        slug
        title
        coverImage
        category
        publishedAt
      }
    }
  }
`;
