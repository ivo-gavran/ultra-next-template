import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

type AxeResults = Awaited<ReturnType<AxeBuilder["analyze"]>>;

const auditedRoutes = [
  { name: "English home", path: "/en", colorScheme: "light" },
  { name: "Bosnian home", path: "/bs", colorScheme: "dark" },
  {
    name: "localized not-found",
    path: "/bs/nepostojeca-stranica",
    colorScheme: "light",
  },
] as const;

const blockingImpacts = new Set(["serious", "critical"]);

function formatViolations(violations: AxeResults["violations"]) {
  return violations
    .map((violation) => {
      const targets = violation.nodes.flatMap((node) => node.target).join(", ");

      return `${violation.impact}: ${violation.id} — ${violation.help} (${targets})`;
    })
    .join("\n");
}

for (const route of auditedRoutes) {
  test(`${route.name} has no serious accessibility violations`, async ({
    page,
  }) => {
    // Audit both locale and color-scheme combinations.
    await page.emulateMedia({
      colorScheme: route.colorScheme,
      reducedMotion: "reduce",
    });
    await page.goto(route.path);
    await expect(page.locator("main")).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const violations = results.violations.filter(({ impact }) =>
      impact ? blockingImpacts.has(impact) : false,
    );

    expect(violations, formatViolations(violations)).toEqual([]);
  });
}

test("keyboard users can skip repeated navigation", async ({ page }) => {
  await page.goto("/en");

  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  const main = page.locator("#main-content");

  await expect(main).toBeAttached();
  await expect(
    page.getByRole("button", { name: "Toggle color theme" }),
  ).toBeEnabled();
  await skipLink.focus();
  await expect(skipLink).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(main).toBeFocused();
});
