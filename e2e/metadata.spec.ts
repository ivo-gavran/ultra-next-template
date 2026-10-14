import { expect, test } from "@playwright/test";

import siteIdentity from "../src/config/site-config.json" with { type: "json" };

test("renders localized canonical and social metadata", async ({
  baseURL,
  page,
}) => {
  const origin = new URL(baseURL ?? "http://127.0.0.1:3100").origin;

  await page.goto("/bs");

  await expect(page).toHaveTitle(siteIdentity.name);
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

  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    siteIdentity.localized.bs.description,
  );

  await page.goto("/en");

  await expect(page).toHaveTitle(siteIdentity.name);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    siteIdentity.localized.en.description,
  );
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
    "content",
    siteIdentity.name,
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
  expect(sitemap).toContain(`<loc>${origin}/en</loc>`);
  expect(sitemap).toContain(`<loc>${origin}/bs</loc>`);
  expect(sitemap.match(/<loc>/g)).toHaveLength(2);
  expect(sitemap).toContain('hreflang="bs"');

  const manifestResponse = await request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBe(true);
  await expect(manifestResponse.json()).resolves.toMatchObject({
    name: siteIdentity.name,
    short_name: siteIdentity.shortName,
    start_url: `/${siteIdentity.defaultLocale}`,
    display: "standalone",
  });
});
