import type { MetadataRoute } from "next";

import {
  getLanguageAlternates,
  getLocalizedUrl,
  publicRoutes,
  siteConfig,
} from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.flatMap((route) =>
    siteConfig.locales.map((locale) => ({
      url: getLocalizedUrl(locale, route.path),
      alternates: {
        languages: getLanguageAlternates(route.path),
      },
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
  );
}
