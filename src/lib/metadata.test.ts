import { describe, expect, it } from "vitest";

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
        canonical: "https://ultra.example.test/bs/projects",
        languages: {
          en: "https://ultra.example.test/en/projects",
          bs: "https://ultra.example.test/bs/projects",
          "x-default": "https://ultra.example.test/en/projects",
        },
      },
      openGraph: {
        type: "website",
        title: "Projekti",
        description: "Opis projekta",
        url: "https://ultra.example.test/bs/projects",
        siteName: "Ultra Next",
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
      title: "Ultra Next",
    });

    expect(metadata.title).toEqual({ absolute: "Ultra Next" });
  });
});
