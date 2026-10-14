import { useTranslations, type Locale } from "next-intl";

export function I18nTypeSafetyContract() {
  const t = useTranslations("Resilience");

  t("errorReference", { digest: "reference-123" });

  // @ts-expect-error The interpolation argument is required.
  t("errorReference");

  // @ts-expect-error Unknown message keys must fail type checking.
  t("unknownKey");

  return null;
}

export const supportedLocale: Locale = "en";

// @ts-expect-error Locales outside of the routing configuration are invalid.
export const unsupportedLocale: Locale = "de";
