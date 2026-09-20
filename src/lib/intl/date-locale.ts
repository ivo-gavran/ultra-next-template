/**
 * Chromium's bundled ICU has no month-name data for `bs`, so `Intl` falls back
 * to the root pattern and renders dates like "2026 M09 15" instead of
 * "15. sep 2026.". Node ships full ICU and formats `bs` correctly, which is why
 * the problem only shows up in the browser.
 *
 * Serbian (Latin) is the closest locale with complete data in browsers and
 * shares Bosnian month abbreviations, with August as the single exception
 * ("avg" rather than "aug"). Adjust this map if your product needs different
 * conventions, or supply month names through the message catalogue instead.
 */
const dateFormatLocales: Record<string, string> = {
  bs: "sr-Latn",
};

/**
 * Resolves the locale to use for `Intl` date formatting, substituting locales
 * that browsers cannot format with a closely related one.
 */
export function getDateFormatLocale(locale: string) {
  return dateFormatLocales[locale] ?? locale;
}
