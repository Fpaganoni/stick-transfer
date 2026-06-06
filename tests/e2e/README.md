# E2E Tests — Playwright

## How mocks work

### Browser-side vs. SSR requests

`page.route()` intercepts **browser-side** (fetch/XHR) requests only.
It cannot intercept requests made by the **Next.js server process** during SSR.

```
Browser (Playwright)          Next.js server (Node.js)
┌──────────────────┐          ┌──────────────────────────┐
│ page.route() ✓   │          │ graphqlClient.request()  │
│ intercepts these │          │ runs here — NOT          │
│ fetch/XHR calls  │          │ interceptable by         │
└──────────────────┘          │ page.route()             │
                              └──────────────────────────┘
```

**Consequence:** SSR pages that call the GraphQL API will get `ECONNREFUSED`
(no backend running in E2E). Every SSR page must handle this gracefully:

```typescript
// app/[locale]/opportunities/page.tsx
let initialData = undefined;
try {
  const data = await graphqlClient.request(GET_JOB_OPPORTUNITIES);
  if (data) initialData = data;
} catch {
  // ECONNREFUSED in E2E — client-side hook takes over
}
```

The client-side React Query hook fires after hydration and IS intercepted by
the mock, so users see real (mock) data.

### Recommended pattern for every E2E test

```typescript
test.beforeEach(async ({ page }) => {
  // 1. Register mocks FIRST — before any navigation
  await setupGraphQLMocks(page);

  // 2. Navigate — browser-side requests are now intercepted
  await page.goto("/en");
  await page.waitForLoadState("networkidle");
});

// loginUser does NOT call page.goto("/en") — beforeEach already did.
// Duplicate navigations trigger an extra SSR cycle and stack route handlers.
async function loginUser(page: Page) {
  await page.getByRole("button", { name: /sign in/i }).first().click();
  // ...
  await page.waitForURL(/dashboard/, { timeout: 15_000 });
  await page.waitForLoadState("networkidle");
}
```

### Adding a new GraphQL query to the mocks

Open `tests/e2e/helpers/graphql-mocks.ts` and add a block **above** the
catch-all:

```typescript
if (q.includes("myNewField") || q.includes("MyNewOperation")) {
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ data: { myNewField: [] } }),
  });
}
```

Return the minimum fields the consuming component reads — undefined fields
cause React errors at runtime, not TypeScript compile time.

**Do NOT use `route.continue()`** as the fallback. It passes the request to
the real network where `localhost:4000` is not running, causing `ECONNREFUSED`
and flaky tests. Use `route.fulfill({ data: {} })` to absorb unknown requests.

### Locating elements reliably

Prefer semantic or content-based locators over raw CSS class selectors.
Tailwind class names can change across refactors; visible text and ARIA roles
are stable.

```typescript
// ❌ Fragile — any rounded+clickable element matches
page.locator('[class*="rounded-xl"][class*="cursor-pointer"]').first()

// ✅ Robust — targets the specific card by its content
page.locator('[class*="rounded-xl"][class*="cursor-pointer"]')
  .filter({ hasText: MOCK_OPPORTUNITIES[0].title })
  .first()

// ✅ Even better — wait for content before interacting
await expect(page.getByText(MOCK_OPPORTUNITIES[0].title)).toBeVisible({ timeout: 10_000 });
```

Always wait for the **specific content from mock data** to appear before
clicking, rather than waiting for `networkidle` alone. `networkidle` fires
once all in-flight requests complete, but React may still be reconciling.

## Reviewer checklist — adding a new E2E test

- [ ] `setupGraphQLMocks(page)` called **before** `page.goto()` in `beforeEach`
- [ ] Every GraphQL query the page fires has a handler in `graphql-mocks.ts`
- [ ] The `loginUser` helper (or equivalent) does **not** duplicate the `beforeEach` navigation
- [ ] Card/modal locators use `filter({ hasText })` or role-based locators, not raw CSS only
- [ ] Explicit wait for mock data content before interacting (`getByText(...).toBeVisible()`)
- [ ] No `route.continue()` as catch-all — use `route.fulfill({ data: {} })`

## File structure

```
tests/e2e/
├── helpers/
│   └── graphql-mocks.ts   ← Shared mock data + setupGraphQLMocks()
├── job-flow.spec.ts        ← Job application flow tests
└── README.md               ← This file
```
