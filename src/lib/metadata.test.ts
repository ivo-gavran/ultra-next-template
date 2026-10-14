import { describe, expect, it } from "vitest";

import { siteConfig } from "@/config/site";

import { createPageMetadata } from "./metadata";

describe("createPageMetadata", () => {
  it("creates localized canonical, language and social metadata", () => {
    const metadata = createPageMetadata({
      description: "Opis aplikacije",
      locale: "bs",
      path: "/",
      title: "Početna",
    });

    expect(metadata).toMatchObject({
      title: "Početna",
      description: "Opis aplikacije",
      alternates: {
        canonical: `${siteConfig.url}/bs`,
        languages: {
          en: `${siteConfig.url}/en`,
          bs: `${siteConfig.url}/bs`,
          "x-default": `${siteConfig.url}/${siteConfig.defaultLocale}`,
        },
      },
      openGraph: {
        type: "website",
        title: "Početna",
        description: "Opis aplikacije",
        url: `${siteConfig.url}/bs`,
        siteName: siteConfig.name,
        locale: "bs_BA",
        alternateLocale: ["en_US"],
      },
      twitter: {
        card: "summary",
        title: "Početna",
        description: "Opis aplikacije",
      },
    });
  });

  it("supports an absolute home title that bypasses the root template", () => {
    const metadata = createPageMetadata({
      absoluteTitle: true,
      description: "Description",
      locale: "en",
      path: "/",
      title: siteConfig.name,
    });

    expect(metadata.title).toEqual({ absolute: siteConfig.name });
  });
});
