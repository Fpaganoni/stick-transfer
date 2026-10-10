import { test, expect, type Page } from "@playwright/test";
import {
  setupGraphQLMocks,
  MOCK_UMPIRE_ME,
  MOCK_PLAYER_ME,
  MOCK_PUBLIC_UMPIRE,
  MOCK_EXPLORE_UMPIRES,
  MOCK_UMPIRE_OPPORTUNITY,
  type GraphQLMockOverrides,
} from "./helpers/graphql-mocks";

// ── Helpers ────────────────────────────────────────────────────────────────

/** Opens the landing page with mocks in place, then logs in through the UI. */
async function loginWith(page: Page, overrides: GraphQLMockOverrides) {
  await setupGraphQLMocks(page, overrides);
  await page.goto("/en");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /sign in|iniciar/i }).first().click();
  await page.getByLabel(/email/i).fill("test@sticktransfer.com");
  await page.getByRole("textbox", { name: /password/i }).fill("Test1234!");
  await page.getByRole("button", { name: /login|sign in|iniciar/i }).last().click();
  await page.waitForURL(/opportunities|feed/, { timeout: 15_000 });
  await page.waitForLoadState("networkidle");
}

/** Opens the detail modal of the umpire opportunity from the list. */
async function openUmpireOpportunity(page: Page) {
  await page.goto("/en/opportunities");
  await page.waitForLoadState("networkidle");
  const card = page
    .getByTestId("opportunity-card")
    .filter({ hasText: MOCK_UMPIRE_OPPORTUNITY.title })
    .first();
  await expect(card).toBeVisible({ timeout: 10_000 });
  await card.getByRole("button", { name: /see more|ver más|voir plus/i }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 5_000 });
  return dialog;
}

// ── Tests ──────────────────────────────────────────────────────────────────

test.describe("Umpire registration", () => {
  test("a visitor can register as an umpire and lands on the profile editor", async ({ page }) => {
    await setupGraphQLMocks(page, { me: MOCK_UMPIRE_ME });
    await page.goto("/en/register");
    await page.waitForLoadState("networkidle");

    // Step 1 — role
    await page.getByTestId("role-card-umpire").click();
    await page.getByRole("button", { name: /^next/i }).click();

    // Step 2 — basic data
    await page.getByLabel("First Name").fill("Ana");
    await page.getByLabel("Last Name").fill("Referee");
    await page.getByLabel("Username").fill("ana_ref");
    await page.getByLabel("Email").fill("ref@sticktransfer.com");
    await page.getByLabel("Password", { exact: true }).fill("Password1!");
    await page.getByLabel("Confirm Password").fill("Password1!");
    await page.getByLabel("Country").click();
    await page.getByPlaceholder("Search country...").fill("Spain");
    await page.getByRole("option", { name: /Spain/ }).click();
    await page.getByLabel(/I agree to the Terms/i).check();
    await page.getByRole("button", { name: /^next/i }).click();

    // Step 3 — umpires only give a city; licence data comes later
    await expect(page.getByLabel("Position")).toHaveCount(0);
    await page.getByLabel("City").fill("Madrid");
    const registerRequest = page.waitForRequest(
      (req) => req.url().includes("graphql") && (req.postData() ?? "").includes("register"),
    );
    await page.getByRole("button", { name: /create profile/i }).click();

    const variables = JSON.parse((await registerRequest).postData() ?? "{}").variables;
    expect(variables).toMatchObject({ role: "UMPIRE", city: "Madrid" });
    expect(variables).not.toHaveProperty("position");

    // Landing on the editor, with the umpire form
    await expect(page).toHaveURL(/profile\/edit/, { timeout: 15_000 });
    await expect(page.getByText("Umpire Details")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabel("Licence level")).toBeVisible();
  });

  test("the landing umpires call to action opens registration with the role chosen", async ({ page }) => {
    await setupGraphQLMocks(page);
    await page.goto("/en");
    await page.waitForLoadState("networkidle");

    // On small screens tabs are clickable instead of following the scroll
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Umpires" }).click();
    await page.getByRole("button", { name: /create free account/i }).click();

    // Role picker skipped: the dialog goes straight to the basic data
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByLabel("First Name")).toBeVisible({ timeout: 5_000 });
    await expect(dialog.getByTestId("role-card-umpire")).toHaveCount(0);
  });
});

test.describe("Umpires in explore and profiles", () => {
  test("explore shows umpires with their own filters", async ({ page }) => {
    await loginWith(page, { me: MOCK_PLAYER_ME, exploreUsers: MOCK_EXPLORE_UMPIRES });

    await page.goto("/en/explore");
    await page.waitForLoadState("networkidle");

    // Player filters first, umpire filters only once the role is chosen
    await expect(page.getByRole("button", { name: "Position" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Licence" })).toHaveCount(0);

    const umpireQuery = page.waitForRequest(
      (req) =>
        req.url().includes("graphql") &&
        (req.postData() ?? "").includes("exploreUsers") &&
        (req.postData() ?? "").includes('"role":"UMPIRE"'),
    );
    await page.getByRole("button", { name: "Role" }).click();
    await page.getByRole("button", { name: "Umpire", exact: true }).click();
    await umpireQuery;

    await expect(page.getByRole("button", { name: "Licence" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Modality" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Category" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Position" })).toHaveCount(0);

    await expect(page.getByText("Javier García")).toBeVisible();
    await expect(page.getByText("International", { exact: true })).toBeVisible();
    await expect(page.getByText("Turf", { exact: true })).toBeVisible();
  });

  test("a public umpire profile opens on the officiating tab and can be messaged", async ({ page }) => {
    await loginWith(page, { me: MOCK_PLAYER_ME, getUserByUsername: MOCK_PUBLIC_UMPIRE });

    await page.goto("/en/profile/umpire_garcia");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "Javier García" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: "Officiating" })).toBeVisible();

    // Officiating data is the default tab
    await expect(page.getByText("Real Federación Española de Hockey").first()).toBeVisible();
    await expect(page.getByText("640")).toBeVisible();
    await expect(page.getByText("Licencia de umpire internacional")).toBeVisible();

    // Private licence number is not shown to third parties
    await expect(page.getByText("Licence number")).toHaveCount(0);

    // Any user can message an umpire
    await expect(page.getByTitle("Message")).toBeVisible();
  });
});

test.describe("Umpire opportunities", () => {
  test("an umpire can apply to an umpire opportunity", async ({ page }) => {
    await loginWith(page, { me: MOCK_UMPIRE_ME, jobOpportunities: [MOCK_UMPIRE_OPPORTUNITY] });

    const dialog = await openUmpireOpportunity(page);

    await expect(dialog.getByText("Required licence")).toBeVisible();
    await expect(dialog.getByText("National", { exact: true })).toBeVisible();
    await expect(dialog.getByRole("button", { name: /apply with profile/i })).toBeVisible();
    await expect(dialog.getByText(/only umpires can apply/i)).toHaveCount(0);
  });

  test("a player sees the requirements but is told only umpires can apply", async ({ page }) => {
    await loginWith(page, { me: MOCK_PLAYER_ME, jobOpportunities: [MOCK_UMPIRE_OPPORTUNITY] });

    const dialog = await openUmpireOpportunity(page);

    await expect(dialog.getByText("Required licence")).toBeVisible();
    await expect(dialog.getByRole("button", { name: /apply with profile/i })).toHaveCount(0);
    await expect(dialog.getByText(/only umpires can apply/i)).toBeVisible();
  });
});
