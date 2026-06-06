import { test, expect, type Page } from "@playwright/test";
import {
  setupGraphQLMocks,
  MOCK_OPPORTUNITIES,
} from "./helpers/graphql-mocks";

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Log in via the UI. Mocks must already be registered (done in beforeEach).
 * Does NOT navigate to /en first — beforeEach handles that.
 *
 * Why no page.goto here:
 *   Calling page.goto("/en") inside this function would be a duplicate
 *   navigation (beforeEach already went there). Duplicate navigations
 *   trigger a new SSR cycle and can stack route handlers in unexpected ways.
 */
async function loginUser(page: Page) {
  await page.getByRole("button", { name: /sign in|iniciar/i }).first().click();
  await page.getByLabel(/email/i).fill("test@sticktransfer.com");
  await page.getByRole("textbox", { name: /password/i }).fill("Test1234!");
  await page.getByRole("button", { name: /login|sign in|iniciar/i }).last().click();
  await page.waitForURL(/opportunities|feed/, { timeout: 15_000 });
  await page.waitForLoadState("networkidle");
}

/**
 * Navigate to /en/opportunities and wait until the job card from our mock
 * data is visible. Using the mock title instead of a generic CSS locator
 * avoids false positives from other rounded/clickable elements on the page.
 */
async function goToOpportunitiesAndWaitForCards(page: Page) {
  await page.goto("/en/opportunities");
  await page.waitForLoadState("networkidle");
  // Wait for the page heading first — confirms SSR + client hydration finished
  await expect(
    page.getByRole("heading", { name: /available positions/i }).first(),
  ).toBeVisible({ timeout: 10_000 });
  // Wait for the actual mock card to appear — confirms useJobOpportunities returned data
  await expect(
    page.getByText(MOCK_OPPORTUNITIES[0].title),
  ).toBeVisible({ timeout: 10_000 });
}

/** Returns the card element for our single mock opportunity. */
function getJobCard(page: Page) {
  // Filter by mock title so we match exactly the job card div, not other
  // rounded/clickable elements (buttons, dropdowns, modal backdrop, etc.).
  return page
    .locator('[class*="rounded-xl"][class*="cursor-pointer"]')
    .filter({ hasText: MOCK_OPPORTUNITIES[0].title })
    .first();
}

// ── Tests ──────────────────────────────────────────────────────────────────

test.describe("Job Application Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Mocks MUST be registered before any page.goto call.
    // page.route() only intercepts browser-side requests. SSR (Node.js-side)
    // requests cannot be intercepted — those pages must handle their own errors.
    await setupGraphQLMocks(page);
    await page.goto("/en");
    await page.waitForLoadState("networkidle");
  });

  test("user can log in", async ({ page }) => {
    await page.getByRole("button", { name: /sign in|iniciar/i }).first().click();
    await page.getByLabel(/email/i).fill("test@sticktransfer.com");
    await page.getByRole("textbox", { name: /password/i }).fill("Test1234!");
    await page.getByRole("button", { name: /login|sign in|iniciar/i }).last().click();

    await expect(page).toHaveURL(/opportunities|feed/, { timeout: 15_000 });
  });

  test("logged-in user can browse job opportunities", async ({ page }) => {
    await loginUser(page);
    await goToOpportunitiesAndWaitForCards(page);

    const card = getJobCard(page);
    await expect(card).toBeVisible();
  });

  test("user can open a job opportunity detail", async ({ page }) => {
    await loginUser(page);
    await goToOpportunitiesAndWaitForCards(page);

    const card = getJobCard(page);
    await card.click();

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });
  });

  test("user can apply to a job opportunity", async ({ page }) => {
    await loginUser(page);
    await goToOpportunitiesAndWaitForCards(page);

    const card = getJobCard(page);
    await card.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    const alreadyApplied = await dialog
      .getByText(/already applied|ya aplicaste|déjà postulé/i)
      .isVisible()
      .catch(() => false);

    if (!alreadyApplied) {
      const applyButton = dialog.getByRole("button", {
        name: /apply|postular|postuler/i,
      });
      await expect(applyButton).toBeVisible();
      await applyButton.click();

      await expect(
        page.getByText(/application submitted|solicitud enviada|demande soumise/i),
      ).toBeVisible({ timeout: 8_000 });
    } else {
      await expect(
        dialog.getByText(/already applied|ya aplicaste|déjà postulé/i),
      ).toBeVisible();
    }
  });
});
