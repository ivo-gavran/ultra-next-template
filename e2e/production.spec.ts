import { expect, test } from "@playwright/test";

test.describe("server rendering", () => {
  test.use({ javaScriptEnabled: false });

  test("serves the page content before JavaScript runs", async ({ page }) => {
    const response = await page.goto("/en/projects");

    expect(response?.status()).toBe(200);
    expect(response?.headers()["content-security-policy"]).toContain(
      "object-src 'none'",
    );
    await expect(
      page.getByRole("heading", { name: "Typed data, predictable UI." }),
    ).toBeVisible();
  });
});

test("hydrates and loads API data with application mocks disabled", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  // Only the external backend is replaced; the application runs its production bundle.
  await page.route("https://api.example.test/projects**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/projects/summary") {
      await route.fulfill({
        json: {
          data: {
            total: 1,
            documented: 1,
            createdLast30Days: 1,
            updatedLast7Days: 1,
          },
        },
      });
      return;
    }

    await route.fulfill({
      json: {
        data: {
          items: [
            {
              id: "5e8f9e0d-1cd7-41e3-86f4-7c1305c6be76",
              name: "Production API project",
              description: "Loaded through the production API client.",
              createdAt: "2026-09-15T09:00:00.000Z",
              updatedAt: "2026-09-15T09:00:00.000Z",
            },
          ],
          page: 1,
          pageSize: 3,
          total: 1,
          totalPages: 1,
        },
      },
    });
  });

  await page.goto("/en/projects");
  await expect(
    page.getByRole("cell", { name: "Production API project", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "BS", exact: true }).click();
  await expect(page).toHaveURL(/\/bs\/projects$/);
  await expect(
    page.getByRole("cell", { name: "Production API project", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      async () => (await navigator.serviceWorker.getRegistrations()).length,
    ),
  ).toBe(0);
  expect(errors).toEqual([]);
});
