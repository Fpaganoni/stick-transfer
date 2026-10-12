import { test, expect, type Page } from "@playwright/test";
import {
  setupGraphQLMocks,
  createMockBackend,
  MOCK_ACCOUNT_A,
  MOCK_OPPORTUNITIES,
  MOCK_OPPORTUNITY_B,
  type MockBackend,
} from "./helpers/graphql-mocks";

const PASSWORD = "Test1234!";
const JOB_A = MOCK_OPPORTUNITIES[0];
const JOB_B = MOCK_OPPORTUNITY_B;

// ── Helpers ────────────────────────────────────────────────────────────────

function createBackendWithTwoJobs(): MockBackend {
  return createMockBackend({ jobs: [JOB_A, JOB_B] });
}

/** Registers the fake backend, opens the landing page and logs in as account A. */
async function loginAsAccountA(page: Page, backend: MockBackend) {
  await setupGraphQLMocks(page, { backend });
  await page.goto("/en");
  await page.waitForLoadState("networkidle");

  await page.getByRole("button", { name: /sign in|iniciar/i }).first().click();
  await page.getByLabel(/email/i).fill(MOCK_ACCOUNT_A.email);
  await page.getByRole("textbox", { name: /password/i }).fill(PASSWORD);
  await page.getByRole("button", { name: /login|sign in|iniciar/i }).last().click();
  await page.waitForURL(/opportunities/, { timeout: 15_000 });
  await page.waitForLoadState("networkidle");
}

function cardFor(page: Page, title: string) {
  return page.getByTestId("opportunity-card").filter({ hasText: title }).first();
}

/** Opens the detail modal of the card with the given title. */
async function openOpportunity(page: Page, title: string) {
  const card = cardFor(page, title);
  await expect(card).toBeVisible({ timeout: 10_000 });
  await card.getByRole("button", { name: /see more|ver más|voir plus/i }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: title })).toBeVisible();
  return dialog;
}

async function closeDialog(page: Page) {
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
}

async function applyTo(page: Page, title: string) {
  const dialog = await openOpportunity(page, title);
  const applyButton = dialog.getByRole("button", { name: "Apply with Profile" });
  await expect(applyButton).toBeEnabled();
  await applyButton.click();
  await expect(dialog.getByRole("button", { name: "Application Sent" })).toBeDisabled();
  return dialog;
}

// ── Tests ──────────────────────────────────────────────────────────────────

test.describe("Applications flow", () => {
  test("applying to one opportunity does not mark another one as applied", async ({ page }) => {
    const backend = createBackendWithTwoJobs();
    await loginAsAccountA(page, backend);
    await expect(cardFor(page, JOB_A.title)).toBeVisible({ timeout: 10_000 });

    await applyTo(page, JOB_A.title);
    await expect.poll(() => backend.appliedJobIdsFor(MOCK_ACCOUNT_A.id)).toEqual([JOB_A.id]);
    await closeDialog(page);

    const dialogB = await openOpportunity(page, JOB_B.title);
    await expect(dialogB.getByRole("button", { name: "Apply with Profile" })).toBeEnabled();
    await expect(dialogB.getByRole("button", { name: "Application Sent" })).toHaveCount(0);
    await expect(dialogB.getByText("You already applied")).toHaveCount(0);
  });

  test("an application shows up in Profile > Applications as pending and reopens its detail", async ({
    page,
  }) => {
    const backend = createBackendWithTwoJobs();
    await loginAsAccountA(page, backend);
    await expect(cardFor(page, JOB_A.title)).toBeVisible({ timeout: 10_000 });

    await applyTo(page, JOB_A.title);
    await expect.poll(() => backend.appliedJobIdsFor(MOCK_ACCOUNT_A.id)).toEqual([JOB_A.id]);
    await closeDialog(page);

    await page.getByRole("link", { name: "Profile", exact: true }).first().click();
    await page.waitForURL(/\/profile/, { timeout: 15_000 });

    await page.getByRole("button", { name: "My Applications" }).click();

    const application = page.locator("article[data-status]").filter({ hasText: JOB_A.title });
    await expect(application).toBeVisible({ timeout: 10_000 });
    await expect(application).toContainText(JOB_A.club.name);
    await expect(application).toContainText("Pending");
    await expect(application).toHaveAttribute("data-status", "PENDING");
    await expect(page.locator("article[data-status]").filter({ hasText: JOB_B.title })).toHaveCount(0);

    await application.getByRole("button", { name: JOB_A.title }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: JOB_A.title })).toBeVisible();
    // The light copy is swapped for the full opportunity (description loads).
    await expect(dialog.getByText(JOB_A.description)).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Application Sent" })).toBeDisabled();
  });
});
