import type { Metadata } from "next";

import {
  getLanguageAlternates,
  getLocalizedUrl,
  type PublicPath,
  siteConfig,
} from "@/config/site";
import type { AppLocale } from "@/i18n/routing";

type CreatePageMetadataOptions = {
  absoluteTitle?: boolean;
  description: string;
  locale: AppLocale;
  path: PublicPath;
  title: string;
};

export function createPageMetadata({
  absoluteTitle = false,
  description,
  locale,
  path,
  title,
}: CreatePageMetadataOptions): Metadata {
  const canonical = getLocalizedUrl(locale, path);
  const currentLocale = siteConfig.localized[locale];
  const alternateLocales = siteConfig.locales
    .filter((candidate) => candidate !== locale)
    .map((candidate) => siteConfig.localized[candidate].openGraphLocale);

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical,
      languages: getLanguageAlternates(path),
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      siteName: siteConfig.name,
      locale: currentLocale.openGraphLocale,
      alternateLocale: alternateLocales,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}
