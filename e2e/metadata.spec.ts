import { expect, test } from "@playwright/test";

test("renders localized canonical and social metadata", async ({
  baseURL,
  page,
}) => {
  const origin = new URL(baseURL ?? "http://127.0.0.1:3100").origin;

  await page.goto("/bs");

  await expect(page).toHaveTitle("Ultra Next");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${origin}/bs`,
  );
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute(
    "href",
    `${origin}/en`,
  );
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
    "content",
    "bs_BA",
  );

  await page.goto("/en/projects");

  await expect(page).toHaveTitle("Projects · Ultra Next");
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
    "content",
    "Projects",
  );
});

test("serves crawler and application metadata routes", async ({
  baseURL,
  request,
}) => {
  const origin = new URL(baseURL ?? "http://127.0.0.1:3100").origin;
  const robotsResponse = await request.get("/robots.txt");
  expect(robotsResponse.ok()).toBe(true);
  await expect(robotsResponse.text()).resolves.toContain(
    `Sitemap: ${origin}/sitemap.xml`,
  );

  const sitemapResponse = await request.get("/sitemap.xml");
  expect(sitemapResponse.ok()).toBe(true);
  const sitemap = await sitemapResponse.text();
  expect(sitemap).toContain(`${origin}/en/projects`);
  expect(sitemap).toContain('hreflang="bs"');

  const manifestResponse = await request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBe(true);
  await expect(manifestResponse.json()).resolves.toMatchObject({
    name: "Ultra Next",
    start_url: "/en",
    display: "standalone",
  });
});
