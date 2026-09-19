import { describe, expect, it } from "vitest";

import {
  getLanguageAlternates,
  getLocalizedUrl,
  publicRoutes,
  siteConfig,
} from "./site";

describe("site config", () => {
  it("keeps public routes and localized URLs on the configured origin", () => {
    expect(siteConfig.url).toBe("https://ultra.example.test");
    expect(publicRoutes.map((route) => route.path)).toEqual(["/", "/projects"]);
    expect(getLocalizedUrl("en", "/")).toBe("https://ultra.example.test/en");
    expect(getLocalizedUrl("bs", "/projects")).toBe(
      "https://ultra.example.test/bs/projects",
    );
  });

  it("builds locale and x-default alternates from the same route contract", () => {
    expect(getLanguageAlternates("/projects")).toEqual({
      en: "https://ultra.example.test/en/projects",
      bs: "https://ultra.example.test/bs/projects",
      "x-default": "https://ultra.example.test/en/projects",
    });
  });
});
