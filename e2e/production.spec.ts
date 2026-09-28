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

test("keeps only the previous page visible during pagination", async ({
  page,
}) => {
  const nextPageRequested = Promise.withResolvers<void>();
  const releaseNextPage = Promise.withResolvers<void>();
  const searchRequested = Promise.withResolvers<void>();
  const releaseSearch = Promise.withResolvers<void>();
  const projects = [
    { id: "5e8f9e0d-1cd7-41e3-86f4-7c1305c6be76", name: "First page project" },
    { id: "ef2062a6-844c-4129-a383-b10fc52e9dc8", name: "Another project" },
    { id: "c7520412-474d-4f82-a352-6f938364f9ef", name: "Third project" },
    { id: "6687c693-5aba-497f-9f1e-9bd998184459", name: "Second page project" },
  ];

  await page.route("https://api.example.test/projects**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/projects/summary") {
      await route.fulfill({
        json: {
          data: {
            total: 4,
            documented: 4,
            createdLast30Days: 0,
            updatedLast7Days: 0,
          },
        },
      });
      return;
    }

    const search = url.searchParams.get("search");
    const requestedPage = Number(url.searchParams.get("page") ?? 1);
    if (search) {
      searchRequested.resolve();
      await releaseSearch.promise;
    } else if (requestedPage === 2) {
      nextPageRequested.resolve();
      await releaseNextPage.promise;
    }

    await route.fulfill({
      json: {
        data: {
          items: (search
            ? []
            : projects.slice((requestedPage - 1) * 3, requestedPage * 3)
          ).map((project) => ({
            ...project,
            description: "A paginated project.",
            createdAt: "2026-09-15T09:00:00.000Z",
            updatedAt: "2026-09-15T09:00:00.000Z",
          })),
          page: requestedPage,
          pageSize: 3,
          total: search ? 0 : 4,
          totalPages: search ? 1 : 2,
        },
      },
    });
  });

  await page.goto("/en/projects");
  await expect(
    page.getByRole("cell", { name: "First page project", exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Next", exact: true }).click();
  await nextPageRequested.promise;
  await expect(
    page.getByRole("cell", { name: "First page project", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Next", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Open actions for First page project" }),
  ).toBeDisabled();

  releaseNextPage.resolve();
  await expect(
    page.getByRole("cell", { name: "Second page project", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Previous", exact: true }),
  ).toBeEnabled();

  await page.getByLabel("Search projects").fill("unmatched");
  await searchRequested.promise;
  await expect(
    page.getByRole("cell", { name: "Second page project", exact: true }),
  ).toHaveCount(0);
  releaseSearch.resolve();
  await expect(
    page.getByText("No projects match your search.", { exact: true }),
  ).toBeVisible();
});
