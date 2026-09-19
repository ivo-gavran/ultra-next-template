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
    expect(publicRoutes.map((route) => route.path)).toEqual(["/", "/projects"]);
    expect(getLocalizedUrl("en", "/")).toBe(`${siteConfig.url}/en`);
    expect(getLocalizedUrl("bs", "/projects")).toBe(
      `${siteConfig.url}/bs/projects`,
    );
  });

  it("builds locale and x-default alternates from the same route contract", () => {
    expect(getLanguageAlternates("/projects")).toEqual({
      en: `${siteConfig.url}/en/projects`,
      bs: `${siteConfig.url}/bs/projects`,
      "x-default": `${siteConfig.url}/${siteConfig.defaultLocale}/projects`,
    });
  });
});
