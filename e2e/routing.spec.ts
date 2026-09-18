import { expect, test } from "@playwright/test";

import { resetDatabase } from "./support/database";

test.beforeEach(async () => {
  await resetDatabase();
});

test("redirects the root route to the default locale", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/en$/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Ship the product, not the plumbing.",
    }),
  ).toBeVisible();
});

test("redirects anonymous visitors away from protected routes", async ({
  page,
}) => {
  await page.goto("/en/dashboard");

  await expect(page).toHaveURL(/\/en\/sign-in$/);
  await expect(page.getByText("Welcome back", { exact: true })).toBeVisible();
});

test("switches locale without losing the current route", async ({ page }) => {
  await page.goto("/en");
  await page.getByRole("button", { name: "BS", exact: true }).click();

  await expect(page).toHaveURL(/\/bs$/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Gradi proizvod, ne infrastrukturu.",
    }),
  ).toBeVisible();
});

test("renders a localized not-found page", async ({ page }) => {
  const response = await page.goto("/bs/nepostojeca-stranica");

  expect(response?.status()).toBe(404);
  await expect(
    page.getByText("Stranica nije pronađena", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Nazad na početnu" }),
  ).toHaveAttribute("href", "/bs");
});
