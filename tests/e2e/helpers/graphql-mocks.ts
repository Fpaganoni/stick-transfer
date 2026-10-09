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

/** Second account (user B) used to prove accounts do not share server state. */
export const MOCK_USER_B = {
  ...MOCK_USER,
  id: "user-b-0987654321",
  email: "second@sticktransfer.com",
  name: "Second User",
  username: "seconduser",
};

// ── Stateful fake backend ───────────────────────────────────────────────────

export interface MockAccount {
  id: string;
  email: string;
  /** Full `me` payload returned while this account has a session. */
  me: Record<string, unknown>;
}

export interface MockBackend {
  accounts: MockAccount[];
  jobs: Array<Record<string, unknown> & { id: string }>;
  /** accountId -> ids of saved job opportunities (shared by every browser). */
  saved: Map<string, Set<string>>;
  logoutCalls: number;
  /** Saved job ids of an account, as an array (empty when none). */
  savedFor: (accountId: string) => string[];
}

export interface CreateMockBackendOptions {
  accounts?: MockAccount[];
  jobs?: MockBackend["jobs"];
}

export const MOCK_ACCOUNT_A: MockAccount = {
  id: MOCK_USER.id,
  email: MOCK_USER.email,
  me: MOCK_USER,
};

export const MOCK_ACCOUNT_B: MockAccount = {
  id: MOCK_USER_B.id,
  email: MOCK_USER_B.email,
  me: MOCK_USER_B,
};

/**
 * Creates the server state shared by every page registered against it, so a
 * save made in one browser context is visible from another one.
 */
export function createMockBackend(
  options: CreateMockBackendOptions = {},
): MockBackend {
  const saved = new Map<string, Set<string>>();
  const backend: MockBackend = {
    accounts: options.accounts ?? [MOCK_ACCOUNT_A, MOCK_ACCOUNT_B],
    jobs: options.jobs ?? MOCK_OPPORTUNITIES,
    saved,
    logoutCalls: 0,
    savedFor: (accountId) => [...(saved.get(accountId) ?? [])],
  };
  return backend;
}

const UNAUTHENTICATED_BODY = {
  errors: [
    {
      message: "Unauthorized",
      extensions: { code: "UNAUTHENTICATED" },
    },
  ],
  data: null,
};

/**
 * Returns a JSON body for operations owned by the stateful backend, or null
 * when the operation is not one of them. `session` holds the per-page
 * "cookie": the id of the logged-in account.
 */
function handleBackendOperation(
  backend: MockBackend,
  session: { accountId: string | null },
  query: string,
  variables: Record<string, unknown>,
): unknown | null {
  const savedIds = () =>
    session.accountId ? (backend.saved.get(session.accountId) ?? new Set<string>()) : new Set<string>();
  const withSavedFlag = (job: MockBackend["jobs"][number]) => ({
    ...job,
    isSavedByCurrentUser: savedIds().has(job.id),
  });

  if (query.includes("mutation Login") || query.includes("login(email:")) {
    const account = backend.accounts.find((a) => a.email === variables.email);
    if (!account) {
      return {
        errors: [{ message: "Invalid credentials", extensions: { code: "BAD_USER_INPUT" } }],
        data: null,
      };
    }
    session.accountId = account.id;
    return { data: { login: MOCK_JWT } };
  }

  if (query.includes("mutation Logout")) {
    session.accountId = null;
    backend.logoutCalls += 1;
    return { data: { logout: true } };
  }

  // `unsave` first: "unsaveJobOpportunity(" also contains "saveJobOpportunity(".
  if (query.includes("unsaveJobOpportunity(") || query.includes("saveJobOpportunity(")) {
    if (!session.accountId) return UNAUTHENTICATED_BODY;
    const isUnsave = query.includes("unsaveJobOpportunity(");
    const jobId = String(variables.jobOpportunityId);
    const current = new Set(backend.saved.get(session.accountId) ?? []);
    if (isUnsave) current.delete(jobId);
    else current.add(jobId);
    backend.saved.set(session.accountId, current);
    return isUnsave
      ? { data: { unsaveJobOpportunity: true } }
      : { data: { saveJobOpportunity: true } };
  }

  if (query.includes("savedJobOpportunities")) {
    const ids = savedIds();
    const jobs = backend.jobs
      .filter((job) => ids.has(job.id))
      .map((job) => ({ ...job, isSavedByCurrentUser: true }));
    return { data: { savedJobOpportunities: jobs } };
  }

  if (query.includes("jobOpportunities")) {
    return { data: { jobOpportunities: backend.jobs.map(withSavedFlag) } };
  }

  if (query.includes("query Me") || query.includes("me {") || query.includes("me{")) {
    const account = backend.accounts.find((a) => a.id === session.accountId);
    return { data: { me: account ? account.me : null } };
  }

  return null;
}

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
export interface GraphQLMockOverrides {
  /** Replaces the `me` payload (e.g. to log in as an umpire). */
  me?: Record<string, unknown>;
  /** Replaces the opportunities list. */
  jobOpportunities?: unknown[];
  /** Rows returned by `exploreUsers`, regardless of the filters sent. */
  exploreUsers?: unknown[];
  /** Payload returned by `getUserByUsername`. */
  getUserByUsername?: Record<string, unknown>;
  /**
   * Stateful fake backend. When present its handlers run before every other
   * one and sessions/saved jobs follow the logged-in account.
   */
  backend?: MockBackend;
}

export async function setupGraphQLMocks(
  page: Page,
  overrides: GraphQLMockOverrides = {},
): Promise<void> {
  // Per-page "cookie": which backend account this browser is logged in as.
  const session: { accountId: string | null } = { accountId: null };

  await page.route("**/graphql", (route) => {
    let body: { query?: string; variables?: Record<string, unknown> } | null = null;
    try {
      const raw = route.request().postData();
      if (raw) body = JSON.parse(raw);
    } catch {
      // non-JSON body — fall through to catch-all
    }

    const q = body?.query ?? "";

    if (overrides.backend) {
      const result = handleBackendOperation(
        overrides.backend,
        session,
        q,
        body?.variables ?? {},
      );
      if (result !== null) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(result),
        });
      }
    }

    // ── Auth ────────────────────────────────────────────────────────────────
    if (q.includes("mutation Login") || q.includes("login(email:")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { login: MOCK_JWT } }),
      });
    }

    // ── Overrides used by the umpire flows ───────────────────────────────────
    // Checked before `me`: their documents also contain "me {" style fragments.
    if (overrides.exploreUsers && q.includes("exploreUsers")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { exploreUsers: overrides.exploreUsers } }),
      });
    }

    if (overrides.getUserByUsername && q.includes("getUserByUsername")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: { getUserByUsername: overrides.getUserByUsername },
        }),
      });
    }

    // `me` — resolved server-side from the JWT, used right after
    // login/register/oauth and for the own-profile page.
    if (q.includes("query Me") || q.includes("me {") || q.includes("me{")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { me: overrides.me ?? MOCK_USER } }),
      });
    }

    // GetUser — viewing another user's profile by id.
    if (q.includes("user(id:") && !q.includes("users")) {
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
        body: JSON.stringify({
          data: { jobOpportunities: overrides.jobOpportunities ?? MOCK_OPPORTUNITIES },
        }),
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

// ── Umpire fixtures ─────────────────────────────────────────────────────────

/** Logged-in umpire as returned by `me` (own data, licence number included). */
export const MOCK_UMPIRE_ME = {
  ...MOCK_USER,
  id: "umpire-me-1",
  email: "ref@sticktransfer.com",
  name: "Ana Referee",
  username: "ana_ref",
  position: null,
  role: "UMPIRE",
  isVerified: false,
  yearsOfExperience: null,
  licenseLevel: null,
  certifyingBody: null,
  licenseNumber: null,
  certificationYear: null,
  matchesOfficiated: null,
  travelAvailability: null,
  languages: [],
  modalities: [],
  umpireCategories: [],
  umpireCertifications: [],
  trajectories: [],
  multimedia: [],
};

/** Logged-in player: can browse but must not be offered umpire applications. */
export const MOCK_PLAYER_ME = { ...MOCK_USER, role: "PLAYER" };

/** Public umpire profile as a third party sees it (licence number hidden). */
export const MOCK_PUBLIC_UMPIRE = {
  id: "umpire-1",
  name: "Javier García",
  username: "umpire_garcia",
  email: null,
  avatar: null,
  coverImage: null,
  coverImagePosition: "50%",
  bio: "Fair play first",
  role: "UMPIRE",
  position: null,
  country: "ES",
  city: "Madrid",
  cvUrl: null,
  multimedia: [],
  isVerified: true,
  yearsOfExperience: 14,
  licenseLevel: "INTERNACIONAL",
  certifyingBody: "Real Federación Española de Hockey",
  licenseNumber: null,
  certificationYear: 2012,
  matchesOfficiated: 640,
  travelAvailability: "REGIONAL",
  languages: ["Español", "English"],
  modalities: ["OUTDOOR", "INDOOR"],
  umpireCategories: ["MAYORES", "FEMENINO"],
  umpireCertifications: [
    {
      id: "c1",
      name: "Licencia de umpire internacional",
      issuer: "Real Federación Española de Hockey",
      issuedAt: "2012-05-31T22:00:00.000Z",
      fileUrl: null,
      order: 0,
    },
  ],
  trajectories: [],
  followers: [],
  following: [],
};

export const MOCK_EXPLORE_UMPIRES = [
  {
    id: "umpire-1",
    name: "Javier García",
    username: "umpire_garcia",
    avatar: null,
    role: "UMPIRE",
    position: null,
    level: null,
    country: "ES",
    city: "Madrid",
    bio: "Fair play first",
    isVerified: true,
    cvUrl: null,
    licenseLevel: "INTERNACIONAL",
    travelAvailability: "REGIONAL",
    modalities: ["OUTDOOR"],
    umpireCategories: ["MAYORES"],
    matchesOfficiated: 640,
    club: null,
  },
];

export const MOCK_UMPIRE_OPPORTUNITY = {
  ...MOCK_OPPORTUNITIES[0],
  id: "opp-umpire-1",
  title: "Umpire - Division de Honor",
  positionType: "UMPIRE",
  licenseLevelRequired: "NACIONAL",
  modality: "OUTDOOR",
  umpireCategory: "MASCULINO",
  matchDate: "2026-11-15T10:00:00.000Z",
  status: "open",
};
