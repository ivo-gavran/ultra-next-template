import { useTranslations, type Locale } from "next-intl";

export function I18nTypeSafetyContract() {
  const t = useTranslations("Projects");

  t("rowActions", { name: "Launch website" });

  // @ts-expect-error The interpolation argument is required.
  t("rowActions");

  // @ts-expect-error Unknown message keys must fail type checking.
  t("unknownKey");

  return null;
}

export const supportedLocale: Locale = "en";

// @ts-expect-error Locales outside of the routing configuration are invalid.
export const unsupportedLocale: Locale = "de";
