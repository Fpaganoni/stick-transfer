import { type Page } from "@playwright/test";

// Valid JWT — jwt-decode only parses, never verifies signature
// Payload: { sub: "1234567890", name: "John Doe", iat: 1516239022 }
export const MOCK_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

export const MOCK_USER = {
  id: "1234567890",
  email: "test@sticktransfer.com",
  name: "Test User",
  username: "testuser",
  avatar: null,
  coverImage: null,
  coverImagePosition: null,
  bio: null,
  position: "Forward",
  role: "Player",
  clubId: null,
  country: "AR",
  city: "Buenos Aires",
  cvUrl: null,
  multimedia: null,
  club: null,
  stats: null,
};

export const MOCK_OPPORTUNITIES = [
  {
    id: "opp-1",
    title: "Forward Player Needed",
    description: "Looking for an experienced forward player.",
    positionType: "Forward",
    club: {
      id: "club-1",
      name: "Test Club",
      city: "Buenos Aires",
      country: "AR",
      isVerified: true,
      // logo intentionally omitted — card renders initial-letter fallback
    },
    level: "Professional",
    country: "AR",
    city: "Buenos Aires",
    salary: "5000",
    currency: "USD",
    benefits: "Full package",
    status: "Open",
    createdAt: new Date().toISOString(),
  },
];

/**
 * Registers Playwright route interceptors for every GraphQL operation fired
 * during E2E tests. Call this BEFORE page.goto() so the handler is in place
 * when the browser makes its first client-side requests after SSR hydration.
 *
 * Why this exists:
 *   page.route() intercepts only browser-side (fetch/XHR) requests.
 *   Server-side (SSR/Node.js) requests to the GraphQL endpoint are made
 *   directly from the Next.js server process and cannot be intercepted here.
 *   Those pages must handle connection failures with try/catch so the
 *   client-side React Query hook takes over — see app/[locale]/opportunities/page.tsx.
 *
 * Adding a new query:
 *   1. Add an `if (q.includes("<field or operation name>"))` block above the catch-all.
 *   2. Return a minimal valid response for the fields the component reads.
 *   3. Do NOT let unhandled requests fall through to route.continue() — that hits
 *      the real backend, which is not running in E2E, causing ECONNREFUSED.
 */
export async function setupGraphQLMocks(page: Page): Promise<void> {
  await page.route("**/graphql", (route) => {
    let body: { query?: string } | null = null;
    try {
      const raw = route.request().postData();
      if (raw) body = JSON.parse(raw);
    } catch {
      // non-JSON body — fall through to catch-all
    }

    const q = body?.query ?? "";

    // ── Auth ────────────────────────────────────────────────────────────────
    if (q.includes("mutation Login") || q.includes("login(email:")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { login: MOCK_JWT } }),
      });
    }

    // GetUserForLogin + GetUser (both use `user(id: ...)` field)
    if (
      q.includes("GetUserForLogin") ||
      (q.includes("user(id:") && !q.includes("users"))
    ) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { user: MOCK_USER } }),
      });
    }

    // ── Opportunities ────────────────────────────────────────────────────────
    if (q.includes("jobOpportunities")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { jobOpportunities: MOCK_OPPORTUNITIES } }),
      });
    }

    if (q.includes("userApplications")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { userApplications: [] } }),
      });
    }

    if (q.includes("ApplyForJob") || q.includes("applyForJob")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            applyForJob: {
              id: "app-1",
              status: "Pending",
              appliedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          },
        }),
      });
    }

    // ── Notifications ────────────────────────────────────────────────────────
    // Header fires UnreadNotificationsCount on every authenticated page load.
    if (
      q.includes("unreadNotificationsCount") ||
      q.includes("UnreadNotificationsCount")
    ) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { unreadNotificationsCount: 0 } }),
      });
    }

    // NotificationDropdown fires MyNotifications (useInfiniteQuery) on mount.
    if (q.includes("myNotifications") || q.includes("MyNotifications")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { myNotifications: [] } }),
      });
    }

    // ── Catch-all ────────────────────────────────────────────────────────────
    // Absorb any unrecognised GraphQL request. Using fulfill (not continue) is
    // critical: continue() would pass the request to the real network where
    // localhost:4000 is not running, causing ECONNREFUSED and flaky tests.
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: {} }),
    });
  });
}
