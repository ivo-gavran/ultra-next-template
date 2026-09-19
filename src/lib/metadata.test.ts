import { describe, expect, it } from "vitest";

import { siteConfig } from "@/config/site";

import { createPageMetadata } from "./metadata";

describe("createPageMetadata", () => {
  it("creates localized canonical, language and social metadata", () => {
    const metadata = createPageMetadata({
      description: "Opis projekta",
      locale: "bs",
      path: "/projects",
      title: "Projekti",
    });

    expect(metadata).toMatchObject({
      title: "Projekti",
      description: "Opis projekta",
      alternates: {
        canonical: `${siteConfig.url}/bs/projects`,
        languages: {
          en: `${siteConfig.url}/en/projects`,
          bs: `${siteConfig.url}/bs/projects`,
          "x-default": `${siteConfig.url}/${siteConfig.defaultLocale}/projects`,
        },
      },
      openGraph: {
        type: "website",
        title: "Projekti",
        description: "Opis projekta",
        url: `${siteConfig.url}/bs/projects`,
        siteName: siteConfig.name,
        locale: "bs_BA",
        alternateLocale: ["en_US"],
      },
      twitter: {
        card: "summary",
        title: "Projekti",
        description: "Opis projekta",
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
