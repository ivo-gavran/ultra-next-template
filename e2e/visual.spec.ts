import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

const stylePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "visual.css",
);

test("home page in light and dark themes", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/en");
  await expect(page.locator("html")).toHaveClass(/light/);
  await expect(page).toHaveScreenshot("home-light.png", {
    fullPage: true,
    stylePath,
  });

  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page).toHaveScreenshot("home-dark.png", {
    fullPage: true,
    stylePath,
  });
});

test("projects workflow shell", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/en/projects");
  await expect(
    page.getByRole("heading", { level: 3, name: "Connect the real API" }),
  ).toBeVisible();

  await expect(page).toHaveScreenshot("projects-light.png", {
    fullPage: true,
    stylePath,
  });
});

test("mobile home shell", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/en");

  await expect(page).toHaveScreenshot("home-mobile.png", {
    fullPage: true,
    stylePath,
  });
});
