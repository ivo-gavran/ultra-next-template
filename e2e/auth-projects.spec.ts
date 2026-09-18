import { expect, test } from "@playwright/test";

import { resetDatabase } from "./support/database";

test.beforeEach(async () => {
  await resetDatabase();
});

test("completes the account and project lifecycle", async ({ page }) => {
  const email = "ada@example.com";
  const password = "correct-horse-battery-staple";
  const projectName = "Launch website";

  await page.goto("/en/sign-up");
  await page.getByLabel("Name").fill("Ada Lovelace");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/en\/dashboard$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Welcome, Ada Lovelace" }),
  ).toBeVisible();

  await page.getByLabel("Project name").fill(projectName);
  await page
    .getByLabel("Description")
    .fill("A project created through the real API.");
  await page.getByRole("button", { name: "Add project" }).click();

  await expect(
    page.getByRole("heading", { level: 3, name: projectName }),
  ).toBeVisible();

  await page.getByRole("button", { name: "BS", exact: true }).click();
  await expect(page).toHaveURL(/\/bs\/dashboard$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Dobro došli, Ada Lovelace" }),
  ).toBeVisible();

  await page.getByRole("button", { name: `Obriši ${projectName}` }).click();
  await expect(
    page.getByRole("heading", { level: 3, name: projectName }),
  ).not.toBeVisible();

  await page.getByRole("button", { name: "Odjava" }).click();
  await expect(page).toHaveURL(/\/bs$/);

  await page.goto("/bs/dashboard");
  await expect(page).toHaveURL(/\/bs\/sign-in$/);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Lozinka").fill(password);
  await page.getByRole("button", { name: "Prijavi se" }).click();

  await expect(page).toHaveURL(/\/bs\/dashboard$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Dobro došli, Ada Lovelace" }),
  ).toBeVisible();
});
