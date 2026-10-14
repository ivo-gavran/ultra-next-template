import { describe, expect, it } from "vitest";

import {
  getLanguageAlternates,
  getLocalizedUrl,
  publicRoutes,
  siteConfig,
} from "./site";

describe("site config", () => {
  it("keeps public routes and localized URLs on the configured origin", () => {
    expect(siteConfig.url).toBe("https://app.example.test");
    expect(siteConfig.name).toBeTruthy();
    expect(publicRoutes.map((route) => route.path)).toEqual(["/"]);
    expect(getLocalizedUrl("en", "/")).toBe(`${siteConfig.url}/en`);
    expect(getLocalizedUrl("bs", "/")).toBe(`${siteConfig.url}/bs`);
  });

  it("builds locale and x-default alternates from the same route contract", () => {
    expect(getLanguageAlternates("/")).toEqual({
      en: `${siteConfig.url}/en`,
      bs: `${siteConfig.url}/bs`,
      "x-default": `${siteConfig.url}/${siteConfig.defaultLocale}`,
    });
  });
});
