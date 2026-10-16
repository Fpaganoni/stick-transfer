import { test, expect, type Browser, type Page } from "@playwright/test";

// What: club journey against the REAL backend (no GraphQL mocks): register a
//   club -> upload its crest -> publish a vacancy -> close it -> check what a
//   visitor (a signed-in player, since /clubs/* needs a session) sees -> delete
//   the vacancy.
// Why: the club profile is one view for owner and visitors; only a real run
//   proves the owner actions and the "visitors only see OPEN vacancies" rule
//   end to end (cookies, Cloudinary signature, status filter).
//
// Gated: it writes to the dev database and uploads ONE tiny image to Cloudinary.
// Run it with E2E_REAL_BACKEND=1 and the backend on NEXT_PUBLIC_GRAPHQL_URL.
// The club account cannot be deleted from the app, so one e2e club stays behind.

test.describe("Club flow (real backend)", () => {
  test.skip(!process.env.E2E_REAL_BACKEND, "needs the real backend (set E2E_REAL_BACKEND=1)");

  const stamp = Date.now();
  const email = `e2e-club-${stamp}@hockey-test.com`;
  const clubName = `E2E Club ${stamp}`;
  const username = `e2e_club_${stamp % 1e9}`;
  const vacancyTitle = `e2e-goalkeeper-${stamp}`;
  // Built per run, never printed. Has lower, upper, number and symbol.
  const password = `Pw-${stamp}-aZ!`;

  // 1x1 transparent PNG (68 bytes)
  const TINY_PNG = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    "base64",
  );

  /**
   * A visitor of the club: a fresh browser context (no cookies, no storage) with
   * a brand new PLAYER account. A logged-out visitor cannot be used: proxy.ts
   * sends every /clubs/* request without a session to the landing page.
   */
  async function newVisitor(browser: Browser, baseURL: string | undefined) {
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();
    await page.goto("/en/register");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("role-card-player").click();
    await page.getByRole("button", { name: /^next/i }).click();
    await page.getByLabel("First Name").fill("Vic");
    await page.getByLabel("Last Name").fill("Visitor");
    await page.getByLabel("Username").fill(`e2e_vis_${stamp % 1e9}`);
    await page.getByLabel("Email").fill(`e2e-visitor-${stamp}@hockey-test.com`);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Confirm Password").fill(password);
    await page.getByLabel("Country").click();
    await page.getByPlaceholder("Search country...").fill("Spain");
    await page.getByRole("option", { name: /Spain/ }).click();
    await page.getByLabel(/I agree to the Terms/i).check();
    await page.getByRole("button", { name: /^next/i }).click();
    await page.locator("#position").selectOption({ index: 1 });
    await page.getByRole("button", { name: /create profile/i }).click();
    await expect(page).toHaveURL(/opportunities/, { timeout: 45_000 });
    return { context, page };
  }

  /** Opens the club page of the visitor on its Vacancies tab. */
  async function openVacancies(page: Page, clubId: string) {
    await page.goto(`/en/clubs/${clubId}`);
    await expect(page.getByRole("tablist")).toBeVisible({ timeout: 30_000 });
    await page.getByRole("tab", { name: "Vacancies" }).click();
  }

  let visitor: Awaited<ReturnType<typeof newVisitor>> | undefined;
  test.afterEach(async () => {
    await visitor?.context.close();
  });

  async function expectNoOwnerActions(page: Page) {
    for (const name of ["Close", "Reopen", "Mark as filled", "Delete", "Applicants", "Publish vacancy"]) {
      await expect(page.getByRole("button", { name, exact: true })).toHaveCount(0);
      await expect(page.getByRole("link", { name, exact: true })).toHaveCount(0);
    }
  }

  test("a club registers, completes its profile, publishes and closes a vacancy", async ({
    page,
    browser,
    baseURL,
  }) => {
    test.setTimeout(240_000);

    // Account id, read from the `me` answer the app asks for right after registering
    let clubId = "";
    page.on("response", async (response) => {
      if (clubId || !response.url().includes("graphql")) return;
      try {
        const body = await response.json();
        if (body?.data?.me?.id) clubId = body.data.me.id;
      } catch {
        /* not JSON or body gone */
      }
    });

    await test.step("register the club", async () => {
      await page.goto("/en/register");
      await page.waitForLoadState("networkidle");

      await page.getByTestId("role-card-clubAdmin").click();
      await page.getByRole("button", { name: /^next/i }).click();

      await page.getByLabel("Club Name").fill(clubName);
      await page.getByLabel("Username").fill(username);
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password", { exact: true }).fill(password);
      await page.getByLabel("Confirm Password").fill(password);
      await page.getByLabel("Country").click();
      await page.getByPlaceholder("Search country...").fill("Spain");
      await page.getByRole("option", { name: /Spain/ }).click();
      await page.getByLabel(/I agree to the Terms/i).check();
      await page.getByRole("button", { name: /^next/i }).click();

      await page.getByLabel("City").fill("Madrid");
      await page.getByLabel("First Name").fill("Eva");
      await page.getByLabel("Last Name").fill("Tester");
      await page.getByRole("button", { name: /create profile/i }).click();

      // RATE_LIMITED would show up as an alert instead of the redirect
      await expect(page).toHaveURL(/\/(?:en\/)?profile\/edit/, { timeout: 45_000 });
      expect(clubId, "me.id captured after registering").not.toBe("");
    });

    await test.step("upload the crest and save the description", async () => {
      const notice = page.getByRole("status").filter({ hasText: "Complete your club profile" });
      await expect(notice).toBeVisible({ timeout: 30_000 });

      // The crest dropzone is the first file input of the form (cover is the second)
      await page.locator('input[type="file"]').first().setInputFiles({
        name: "e2e-crest.png",
        mimeType: "image/png",
        buffer: TINY_PNG,
      });
      await expect(page.getByAltText("Club crest")).toBeVisible({ timeout: 45_000 });

      await page
        .getByLabel("Description", { exact: true })
        .fill("Synthetic club created by the e2e suite.");
      await page.getByRole("button", { name: "Save Changes" }).click();

      await expect(page).toHaveURL(/\/(?:en\/)?profile$/, { timeout: 30_000 });
      await expect(page.getByRole("tablist")).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText("Complete your club profile")).toHaveCount(0);
    });

    await test.step("publish a vacancy", async () => {
      await page.getByRole("tab", { name: "Vacancies" }).click();
      await page.getByRole("link", { name: "Publish vacancy" }).click();
      await expect(page).toHaveURL(/\/(?:en\/)?opportunities\/new/, { timeout: 30_000 });

      await page.getByLabel("Job title").fill(vacancyTitle);
      await page.getByLabel("Description", { exact: true }).fill("Synthetic vacancy created by the e2e suite.");
      await page.getByRole("combobox", { name: "Position type" }).click();
      await page.getByRole("option", { name: "Player" }).click();
      await page.getByLabel("Country").click();
      await page.getByPlaceholder("Search country...").fill("Spain");
      await page.getByRole("option", { name: /Spain/ }).click();
      await page.getByLabel("City", { exact: true }).fill("Madrid");
      await page.getByRole("button", { name: "Publish opportunity" }).click();

      await expect(page).toHaveURL(/\/(?:en\/)?opportunities$/, { timeout: 30_000 });
    });

    await test.step("a visitor sees the open vacancy", async () => {
      visitor = await newVisitor(browser, baseURL);
      await openVacancies(visitor.page, clubId);
      await expect(visitor.page.getByText(vacancyTitle).first()).toBeVisible({ timeout: 30_000 });
      await expect(visitor.page.getByText(/not verified|unverified/i)).toHaveCount(0);
      await expect(visitor.page.getByText("Verified club")).toHaveCount(0);
      await expectNoOwnerActions(visitor.page);
    });

    await test.step("the owner closes the vacancy", async () => {
      await page.goto("/en/profile");
      await page.getByRole("tab", { name: "Vacancies" }).click();
      await expect(page.getByText(vacancyTitle).first()).toBeVisible({ timeout: 30_000 });

      await page.getByRole("button", { name: "Close", exact: true }).click();
      await expect(page.getByRole("button", { name: "Reopen", exact: true })).toBeVisible({ timeout: 15_000 });
    });

    await test.step("a visitor no longer sees the closed vacancy", async () => {
      await openVacancies(visitor!.page, clubId);
      await expect(visitor!.page.getByText("No open positions at the moment.")).toBeVisible({ timeout: 30_000 });
      await expect(visitor!.page.getByText(vacancyTitle)).toHaveCount(0);
    });

    await test.step("the owner deletes the vacancy", async () => {
      await page.goto("/en/profile");
      await page.getByRole("tab", { name: "Vacancies" }).click();
      await expect(page.getByText(vacancyTitle).first()).toBeVisible({ timeout: 30_000 });

      await page.getByRole("button", { name: "Delete", exact: true }).click();
      await page.getByRole("alertdialog").getByRole("button", { name: "Delete vacancy" }).click();

      await expect(page.getByText(vacancyTitle)).toHaveCount(0, { timeout: 15_000 });
      await expect(page.getByText("You have not published any vacancy yet.")).toBeVisible();
    });
  });
});
