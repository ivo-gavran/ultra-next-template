import { describe, expect, it } from "vitest";

import { publicEnvSchema } from "@/config/public-env";
import { validatePublicUrl } from "@/config/url-validation";
import { validateSetupValues } from "../../scripts/setup";

const values = {
  name: "App",
  shortName: "App",
  packageName: "app",
  defaultLocale: "en",
  descriptionEn: "English",
  descriptionBs: "Bosanski",
  appUrl: "http://localhost:3000",
  apiUrl: "http://localhost:4000/v1",
};

describe("shared public URL validation", () => {
  it.each([
    [
      "http://localhost:3000/",
      "http://localhost:4000/v1/",
      "http://localhost:3000",
      "http://localhost:4000/v1",
    ],
    [
      "https://app.example.test",
      "https://api.example.test/v1",
      "https://app.example.test",
      "https://api.example.test/v1",
    ],
    [
      "https://APP.example.test:443/",
      "http://127.0.0.1:4000/v1/items",
      "https://app.example.test",
      "http://127.0.0.1:4000/v1/items",
    ],
  ])(
    "runtime and setup agree for %s and %s",
    (appUrl, apiUrl, normalizedApp, normalizedApi) => {
      expect(
        publicEnvSchema.parse({
          NEXT_PUBLIC_APP_URL: appUrl,
          NEXT_PUBLIC_API_URL: apiUrl,
        }),
      ).toEqual({
        NEXT_PUBLIC_APP_URL: normalizedApp,
        NEXT_PUBLIC_API_URL: normalizedApi,
      });
      expect(
        validateSetupValues({ ...values, appUrl, apiUrl }, ["en", "bs"]),
      ).toMatchObject({ appUrl: normalizedApp, apiUrl: normalizedApi });
    },
  );

  it.each([
    "file:///tmp/api",
    "ftp://api.example.test",
    "javascript:alert(1)",
    "data:text/plain,test",
    "https://synthetic-user:synthetic-password@api.example.test",
    "https://synthetic-user@api.example.test",
    "https://:synthetic-password@api.example.test",
    "https://api.example.test?key=synthetic-key",
    "https://api.example.test#synthetic-token",
    "https://api.example.test?",
    "https://api.example.test#",
    "not-a-url",
    "//api.example.test",
    "https:api.example.test",
    "https:\\api.example.test",
    "https://api.example.test\n",
  ])("rejects %s at runtime and setup without echoing input", (url) => {
    for (const kind of ["app", "api"] as const) {
      expect(() => validatePublicUrl(url, kind)).toThrow();
      const field =
        kind === "app" ? "NEXT_PUBLIC_APP_URL" : "NEXT_PUBLIC_API_URL";
      expect(() =>
        publicEnvSchema.parse({
          NEXT_PUBLIC_APP_URL: values.appUrl,
          NEXT_PUBLIC_API_URL: values.apiUrl,
          [field]: url,
        }),
      ).toThrow();
      expect(() =>
        validateSetupValues(
          { ...values, [kind === "app" ? "appUrl" : "apiUrl"]: url },
          ["en", "bs"],
        ),
      ).toThrow();
      try {
        validatePublicUrl(url, kind);
      } catch (error) {
        expect(String(error)).not.toContain("synthetic-");
      }
    }
  });

  it("restricts app URLs to origins while allowing API path prefixes", () => {
    expect(() =>
      validatePublicUrl("https://app.example.test/v1", "app"),
    ).toThrow("path");
    expect(validatePublicUrl("https://api.example.test/v1", "api")).toBe(
      "https://api.example.test/v1",
    );
  });
});
