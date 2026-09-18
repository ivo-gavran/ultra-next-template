import { expect, test } from "@playwright/test";

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

test("switches locale without losing the current route", async ({ page }) => {
  await page.goto("/en/projects");
  await page.getByRole("button", { name: "BS", exact: true }).click();

  await expect(page).toHaveURL(/\/bs\/projects$/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Tipizovani podaci, predvidiv UI.",
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
