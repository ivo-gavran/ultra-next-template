import { describe, expect, it } from "vitest";

import { getDateFormatLocale } from "@/lib/intl/date-locale";

describe("getDateFormatLocale", () => {
  it("substitutes locales browsers cannot format with month names", () => {
    expect(getDateFormatLocale("bs")).toBe("sr-Latn");
  });

  it("passes through locales with complete browser data", () => {
    expect(getDateFormatLocale("en")).toBe("en");
  });

  it("keeps the requested locale when no substitution is configured", () => {
    expect(getDateFormatLocale("de-AT")).toBe("de-AT");
  });

  it("resolves to a locale that formats month names", () => {
    const formatted = new Intl.DateTimeFormat(getDateFormatLocale("bs"), {
      month: "short",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(2026, 8, 15)));

    // The root-pattern fallback renders "M09" instead of a month name.
    expect(formatted).not.toMatch(/^M\d\d$/);
  });
});
