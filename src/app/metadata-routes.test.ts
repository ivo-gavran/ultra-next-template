import { describe, expect, it } from "vitest";

import manifest from "./manifest";
import robots from "./robots";
import sitemap from "./sitemap";

describe("metadata routes", () => {
  it("publishes an application manifest from the shared site identity", () => {
    expect(manifest()).toMatchObject({
      id: "/",
      name: "Ultra Next",
      short_name: "Ultra Next",
      start_url: "/en",
      scope: "/",
      display: "standalone",
      lang: "en",
      icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
    });
  });

  it("points crawlers to the canonical sitemap", () => {
    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/" },
      sitemap: "https://ultra.example.test/sitemap.xml",
      host: "https://ultra.example.test",
    });
  });

  it("lists every public route in every locale without volatile timestamps", () => {
    const entries = sitemap();

    expect(entries).toHaveLength(4);
    expect(entries.map((entry) => entry.url)).toEqual([
      "https://ultra.example.test/en",
      "https://ultra.example.test/bs",
      "https://ultra.example.test/en/projects",
      "https://ultra.example.test/bs/projects",
    ]);
    expect(entries.every((entry) => entry.lastModified === undefined)).toBe(
      true,
    );
    expect(entries[2]?.alternates?.languages).toEqual({
      en: "https://ultra.example.test/en/projects",
      bs: "https://ultra.example.test/bs/projects",
      "x-default": "https://ultra.example.test/en/projects",
    });
  });
});
