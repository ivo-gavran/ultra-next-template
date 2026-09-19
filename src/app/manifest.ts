import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    description: siteConfig.localized[siteConfig.defaultLocale].description,
    start_url: `/${siteConfig.defaultLocale}`,
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111827",
    lang: siteConfig.defaultLocale,
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
