import { test, expect, type Page } from "@playwright/test";

// Valid JWT (jwt-decode only parses, never verifies signature)
// Payload: { sub: "1234567890", name: "John Doe", iat: 1516239022 }
const MOCK_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

const MOCK_USER = {
  id: "1234567890",
  email: "test@scordd.com",
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

const MOCK_OPPORTUNITIES = [
  {
    id: "opp-1",
    title: "Forward Player Needed",
    description: "Looking for an experienced forward player.",
    positionType: "Forward",
    club: { name: "Test Club", city: "Buenos Aires", country: "AR", isVerified: true },
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

async function setupGraphQLMocks(page: Page) {
  await page.route("**/graphql", (route) => {
    const request = route.request();
    let body: { query?: string } | null = null;
    try {
      const raw = request.postData();
      if (raw) body = JSON.parse(raw);
    } catch {
      // non-JSON body — pass through
    }

    if (!body?.query) {
      route.continue();
      return;
    }

    const q = body.query;

    if (q.includes("mutation Login") || q.includes("login(email:")) {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { login: MOCK_JWT } }),
      });
      return;
    }

    if (q.includes("GetUserForLogin") || (q.includes("user(id:") && !q.includes("users"))) {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { user: MOCK_USER } }),
      });
      return;
    }

    if (q.includes("jobOpportunities")) {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { jobOpportunities: MOCK_OPPORTUNITIES } }),
      });
      return;
    }

    if (q.includes("userApplications")) {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { userApplications: [] } }),
      });
      return;
    }

    if (q.includes("ApplyForJob") || q.includes("applyForJob")) {
      route.fulfill({
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
      return;
    }

    route.continue();
  });
}

test.describe("Job Application Flow", () => {
  test.beforeEach(async ({ page }) => {
    await setupGraphQLMocks(page);
    await page.goto("/en/login");
  });

  test("user can log in", async ({ page }) => {
    await page.getByLabel(/email/i).fill("test@scordd.com");
    await page.getByRole("textbox", { name: /password/i }).fill("Test1234!");
    await page.getByRole("button", { name: /login|sign in|iniciar/i }).click();

    await expect(page).toHaveURL(/opportunities|feed/, { timeout: 15_000 });
  });

  test("logged-in user can browse job opportunities", async ({ page }) => {
    await loginUser(page);

    await page.goto("/en/opportunities");
    await expect(
      page.getByRole("heading", { name: /available positions|positions/i })
    ).toBeVisible({ timeout: 10_000 });

    const jobCards = page.locator('[class*="rounded-xl"][class*="border-l-4"]');
    await expect(jobCards.first()).toBeVisible({ timeout: 10_000 });
  });

  test("user can open a job opportunity detail", async ({ page }) => {
    await loginUser(page);

    await page.goto("/en/opportunities");

    const firstCard = page
      .locator('[class*="rounded-xl"][class*="border-l-4"]')
      .first();
    await firstCard.waitFor({ timeout: 10_000 });
    await firstCard.click();

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });
  });

  test("user can apply to a job opportunity", async ({ page }) => {
    await loginUser(page);

    await page.goto("/en/opportunities");

    const firstCard = page
      .locator('[class*="rounded-xl"][class*="border-l-4"]')
      .first();
    await firstCard.waitFor({ timeout: 10_000 });
    await firstCard.click();

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
        page.getByText(/application submitted|solicitud enviada|demande soumise/i)
      ).toBeVisible({ timeout: 8_000 });
    } else {
      await expect(
        dialog.getByText(/already applied|ya aplicaste|déjà postulé/i)
      ).toBeVisible();
    }
  });
});

async function loginUser(page: Page) {
  await page.goto("/en/login");
  await page.getByLabel(/email/i).fill("test@scordd.com");
  await page.getByRole("textbox", { name: /password/i }).fill("Test1234!");
  await page.getByRole("button", { name: /login|sign in|iniciar/i }).click();
  await page.waitForURL(/opportunities|feed/, { timeout: 15_000 });
}
