import { defineRouting } from "next-intl/routing";

import siteIdentity from "@/config/site-config.json";

export const appLocales = ["en", "bs"] as const;
export type AppLocale = (typeof appLocales)[number];

function isAppLocale(value: string): value is AppLocale {
  return appLocales.some((locale) => locale === value);
}

if (!isAppLocale(siteIdentity.defaultLocale)) {
  throw new Error(
    `Unsupported default locale: ${siteIdentity.defaultLocale}. Expected one of: ${appLocales.join(", ")}`,
  );
}

export const routing = defineRouting({
  locales: appLocales,
  defaultLocale: siteIdentity.defaultLocale,
  localePrefix: "always",
});
