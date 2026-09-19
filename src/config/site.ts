import { publicEnv } from "@/config/public-env";
import { routing, type AppLocale } from "@/i18n/routing";

type LocalizedSiteConfig = {
  description: string;
  openGraphLocale: string;
};

const localized = {
  en: {
    description:
      "A production-minded Next.js frontend starter with typed API boundaries, query state, i18n and a complete quality toolchain.",
    openGraphLocale: "en_US",
  },
  bs: {
    description:
      "Next.js frontend starter spreman za produkciju, sa tipizovanim API granicama, query stateom, internacionalizacijom i kompletnim quality toolchainom.",
    openGraphLocale: "bs_BA",
  },
} satisfies Record<AppLocale, LocalizedSiteConfig>;

export const siteConfig = {
  name: "Ultra Next",
  shortName: "Ultra Next",
  url: publicEnv.NEXT_PUBLIC_APP_URL,
  defaultLocale: routing.defaultLocale,
  locales: routing.locales,
  localized,
} as const;

export const publicRoutes = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/projects", changeFrequency: "monthly", priority: 0.7 },
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
