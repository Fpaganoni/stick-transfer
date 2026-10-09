import { test, expect, type Page } from "@playwright/test";
import {
  setupGraphQLMocks,
  createMockBackend,
  MOCK_ACCOUNT_A,
  MOCK_ACCOUNT_B,
  MOCK_OPPORTUNITIES,
  type MockBackend,
} from "./helpers/graphql-mocks";

const PASSWORD = "Test1234!";
const JOB_ID = MOCK_OPPORTUNITIES[0].id;
/** localStorage keys that hold preferences, not user data. */
const PREFERENCE_KEYS = ["theme"];

// ── Helpers ────────────────────────────────────────────────────────────────

/** Registers the shared fake backend on the page and opens the landing page. */
async function openLanding(page: Page, backend: MockBackend) {
  await setupGraphQLMocks(page, { backend });
  await page.goto("/en");
  await page.waitForLoadState("networkidle");
}

/** Logs in through the modal. Does not navigate: openLanding already did. */
async function loginAs(page: Page, email: string) {
  await page.getByRole("button", { name: /sign in|iniciar/i }).first().click();
  await page.getByLabel(/email/i).fill(email);
  await page.getByRole("textbox", { name: /password/i }).fill(PASSWORD);
  await page.getByRole("button", { name: /login|sign in|iniciar/i }).last().click();
  await page.waitForURL(/opportunities|feed/, { timeout: 15_000 });
  await page.waitForLoadState("networkidle");
}

/** Opens /en/opportunities and waits for the mock card; returns its Bookmark. */
async function openOpportunitiesBookmark(page: Page) {
  await page.goto("/en/opportunities");
  const card = page
    .getByTestId("opportunity-card")
    .filter({ hasText: MOCK_OPPORTUNITIES[0].title })
    .first();
  await expect(card).toBeVisible({ timeout: 10_000 });
  return card.getByRole("button", { name: "Bookmark" });
}

/** Logs out through the header: icon button first, then the revealed one. */
async function logoutThroughHeader(page: Page) {
  const logoutButtons = page.getByRole("button", { name: /^log\s?out$/i });
  await logoutButtons.first().click();
  await expect(logoutButtons).toHaveCount(2);
  await logoutButtons.last().click();
}

// ── Tests ──────────────────────────────────────────────────────────────────

test.describe("Saved jobs follow the account, not the browser", () => {
  test("a new user does not see jobs saved by the previous user", async ({ page }) => {
    const backend = createMockBackend();
    await openLanding(page, backend);

    await loginAs(page, MOCK_ACCOUNT_A.email);
    const bookmarkA = await openOpportunitiesBookmark(page);
    await bookmarkA.click();
    await expect(bookmarkA).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => backend.savedFor(MOCK_ACCOUNT_A.id)).toEqual([JOB_ID]);

    await logoutThroughHeader(page);
    // Locale home: "/" (default locale has no prefix) or "/en".
    await page.waitForURL((url) => /^\/(en\/?)?$/.test(url.pathname), {
      timeout: 15_000,
    });
    await expect.poll(() => backend.logoutCalls).toBe(1);

    const storageKeys = await page.evaluate(() => Object.keys(localStorage));
    const unexpectedKeys = storageKeys.filter((key) => !PREFERENCE_KEYS.includes(key));
    expect(unexpectedKeys, `localStorage keys left after logout: ${storageKeys.join(", ")}`).toEqual([]);

    await loginAs(page, MOCK_ACCOUNT_B.email);
    const bookmarkB = await openOpportunitiesBookmark(page);
    await expect(bookmarkB).toHaveAttribute("aria-pressed", "false");
    expect(backend.savedFor(MOCK_ACCOUNT_B.id)).toEqual([]);
  });

  test("a saved job follows the account to another browser", async ({ page, browser }) => {
    const backend = createMockBackend();
    await openLanding(page, backend);
    await loginAs(page, MOCK_ACCOUNT_A.email);
    const bookmarkFirst = await openOpportunitiesBookmark(page);
    await bookmarkFirst.click();
    await expect(bookmarkFirst).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => backend.savedFor(MOCK_ACCOUNT_A.id)).toEqual([JOB_ID]);

    const secondContext = await browser.newContext();
    try {
      const secondPage = await secondContext.newPage();
      await openLanding(secondPage, backend);
      await loginAs(secondPage, MOCK_ACCOUNT_A.email);
      const bookmarkSecond = await openOpportunitiesBookmark(secondPage);
      await expect(bookmarkSecond).toHaveAttribute("aria-pressed", "true");
    } finally {
      await secondContext.close();
    }
  });

  test("the old shared saved-jobs key is removed on startup", async ({ page }) => {
    await page.addInitScript(() => {
      // Seed only once per tab: reloads must not bring the legacy key back.
      if (sessionStorage.getItem("e2e-legacy-seeded")) return;
      sessionStorage.setItem("e2e-legacy-seeded", "1");
      localStorage.setItem("saved-jobs", JSON.stringify([{ id: "legacy-job" }]));
      localStorage.setItem("theme", "dark");
    });

    await openLanding(page, createMockBackend());

    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("saved-jobs")))
      .toBeNull();
    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe("dark");
  });
});
