import { expect, test } from "@playwright/test";

import siteIdentity from "../src/config/site-config.json" with { type: "json" };

test.describe("server rendering", () => {
  test.use({ javaScriptEnabled: false });

  for (const [locale, title] of [
    ["en", "Your application starts here."],
    ["bs", "Vaša aplikacija počinje ovdje."],
  ] as const) {
    test(`serves ${locale} content and metadata without JavaScript`, async ({
      page,
      baseURL,
    }) => {
      const response = await page.goto(`/${locale}`);
      expect(response?.status()).toBe(200);
      expect(response?.headers()["content-security-policy"]).toContain(
        "object-src 'none'",
      );
      await expect(
        page.getByRole("heading", { level: 1, name: title }),
      ).toBeVisible();
      await expect(
        page.getByText(siteIdentity.name, { exact: true }).last(),
      ).toBeVisible();
      await expect(page).toHaveTitle(siteIdentity.name);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `${baseURL}/${locale}`,
      );
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
    });
  }
});

test("hydrates the shell and locale controls without console errors or backend requests", async ({
  page,
}) => {
  const errors: string[] = [];
  const backendRequests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("request", (request) => {
    if (request.url().startsWith("https://api.example.test"))
      backendRequests.push(request.url());
  });
  await page.goto("/en");
  await expect(
    page.getByRole("heading", { name: "Your application starts here." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "BS", exact: true }).click();
  await expect(page).toHaveURL(/\/bs$/);
  await expect(
    page.getByRole("heading", { name: "Vaša aplikacija počinje ovdje." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Promijeni temu" }),
  ).toBeEnabled();
  expect(errors).toEqual([]);
  expect(backendRequests).toEqual([]);
});
