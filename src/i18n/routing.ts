import { hasLocale } from "next-intl";
import { defineRouting } from "next-intl/routing";

import siteIdentity from "@/config/site-config.json";

export const appLocales = ["en", "bs"] as const;
export type AppLocale = (typeof appLocales)[number];

if (!hasLocale(appLocales, siteIdentity.defaultLocale)) {
  throw new Error(
    `Unsupported default locale: ${siteIdentity.defaultLocale}. Expected one of: ${appLocales.join(", ")}`,
  );
}

export const routing = defineRouting({
  locales: appLocales,
  defaultLocale: siteIdentity.defaultLocale,
  localePrefix: "always",
});
