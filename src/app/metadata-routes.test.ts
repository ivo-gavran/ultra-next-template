import { describe, expect, it } from "vitest";

import { siteConfig } from "@/config/site";

import manifest from "./manifest";
import robots from "./robots";
import sitemap from "./sitemap";

describe("metadata routes", () => {
  it("publishes an application manifest from the shared site identity", () => {
    expect(manifest()).toMatchObject({
      id: "/",
      name: siteConfig.name,
      short_name: siteConfig.shortName,
      start_url: `/${siteConfig.defaultLocale}`,
      scope: "/",
      display: "standalone",
      lang: siteConfig.defaultLocale,
      icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
    });
  });

  it("points crawlers to the canonical sitemap", () => {
    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/" },
      sitemap: `${siteConfig.url}/sitemap.xml`,
      host: siteConfig.url,
    });
  });

  it("lists every public route in every locale without volatile timestamps", () => {
    const entries = sitemap();

    expect(entries).toHaveLength(2);
    expect(entries.map((entry) => entry.url)).toEqual([
      `${siteConfig.url}/en`,
      `${siteConfig.url}/bs`,
    ]);
    expect(entries.every((entry) => entry.lastModified === undefined)).toBe(
      true,
    );
    expect(entries[0]?.alternates?.languages).toEqual({
      en: `${siteConfig.url}/en`,
      bs: `${siteConfig.url}/bs`,
      "x-default": `${siteConfig.url}/${siteConfig.defaultLocale}`,
    });
  });
});
