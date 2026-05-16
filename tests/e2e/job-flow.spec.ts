import { test, expect } from "@playwright/test";

const TEST_USER = {
  email: process.env.E2E_USER_EMAIL || "test@scordd.com",
  password: process.env.E2E_USER_PASSWORD || "Test1234!",
};

test.describe("Job Application Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/login");
  });

  test("user can log in", async ({ page }) => {
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    await page.getByRole("button", { name: /login|sign in|iniciar/i }).click();

    await expect(page).toHaveURL(/opportunities|feed/, { timeout: 10_000 });
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

    const applyButton = dialog.getByRole("button", {
      name: /apply|postular|postuler/i,
    });

    const alreadyApplied = await dialog
      .getByText(/already applied|ya aplicaste|déjà postulé/i)
      .isVisible()
      .catch(() => false);

    if (!alreadyApplied) {
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

async function loginUser(page: import("@playwright/test").Page) {
  await page.goto("/en/login");
  await page.getByLabel(/email/i).fill(TEST_USER.email);
  await page.getByLabel(/password/i).fill(TEST_USER.password);
  await page.getByRole("button", { name: /login|sign in|iniciar/i }).click();
  await page.waitForURL(/opportunities|feed/, { timeout: 10_000 });
}
