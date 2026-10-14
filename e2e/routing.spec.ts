import { expect, test } from "@playwright/test";

import siteIdentity from "../src/config/site-config.json" with { type: "json" };

const homeTitles = {
  en: "Your application starts here.",
  bs: "Vaša aplikacija počinje ovdje.",
};

test.describe("default locale", () => {
  test.use({ locale: "de-DE" });

  test("redirects the root route to the default locale without a supported locale preference", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(new RegExp(`/${siteIdentity.defaultLocale}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      homeTitles[siteIdentity.defaultLocale as keyof typeof homeTitles],
    );
  });
});

test("switches locale while preserving URL state and rendering without errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/en?ref=docs");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    homeTitles.en,
  );
  await page.getByRole("button", { name: "BS", exact: true }).click();
  await expect(page).toHaveURL(/\/bs\?ref=docs$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    homeTitles.bs,
  );
  await expect(page.locator("html")).toHaveAttribute("lang", "bs");
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(page).toHaveURL(/\/en\?ref=docs$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    homeTitles.en,
  );
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  expect(errors).toEqual([]);
});

test("switches theme and retains the preference across reload and locale navigation", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/en");
  await expect(page.locator("html")).toHaveClass(/light/);
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "BS", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    homeTitles.bs,
  );
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "Promijeni temu" }).click();
  await expect(page.locator("html")).toHaveClass(/light/);
});

for (const width of [320, 768, 1440]) {
  test(`renders the application shell without overflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/bs");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      homeTitles.bs,
    );
    await expect(
      page.getByRole("link", { name: siteIdentity.shortName, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "EN", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Promijeni temu" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
}

test("renders a localized not-found page", async ({ page }) => {
  const response = await page.goto("/bs/nepostojeca-stranica");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByText("Stranica nije pronađena", { exact: true }),
  ).toBeVisible();
  const backHome = page.getByRole("link", { name: "Nazad na početnu" });
  await expect(backHome).toHaveAttribute("href", "/bs");
  await backHome.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    homeTitles.bs,
  );
});

test("rejects unsupported locales", async ({ page }) => {
  const response = await page.goto("/de");
  expect(response?.status()).toBe(404);
});
