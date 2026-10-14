import { publicEnv } from "@/config/public-env";
import siteIdentity from "@/config/site-config.json";
import { routing, type AppLocale } from "@/i18n/routing";

type LocalizedSiteConfig = {
  description: string;
  openGraphLocale: string;
};

const localized = siteIdentity.localized satisfies Record<
  AppLocale,
  LocalizedSiteConfig
>;

export const siteConfig = {
  name: siteIdentity.name,
  shortName: siteIdentity.shortName,
  url: publicEnv.NEXT_PUBLIC_APP_URL,
  defaultLocale: routing.defaultLocale,
  locales: routing.locales,
  localized,
} as const;

export const publicRoutes = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
] as const;

export type PublicPath = (typeof publicRoutes)[number]["path"];

export function getLocalizedUrl(locale: AppLocale, path: PublicPath) {
  const suffix = path === "/" ? "" : path;
  return new URL(`/${locale}${suffix}`, siteConfig.url).toString();
}

export function getLanguageAlternates(path: PublicPath) {
  return {
    ...Object.fromEntries(
      siteConfig.locales.map((locale) => [
        locale,
        getLocalizedUrl(locale, path),
      ]),
    ),
    "x-default": getLocalizedUrl(siteConfig.defaultLocale, path),
  };
}
