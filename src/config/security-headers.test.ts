import { describe, expect, it } from "vitest";

import {
  createContentSecurityPolicy,
  createSecurityHeaders,
} from "./security-headers";

describe("security headers", () => {
  it("allows the configured API origin without exposing its path", () => {
    const policy = createContentSecurityPolicy({
      apiUrl: "https://api.example.test/v1?token=secret",
    });

    expect(policy).toContain("connect-src 'self' https://api.example.test");
    expect(policy).not.toContain("/v1");
    expect(policy).not.toContain("token");
  });

  it("uses development-only allowances without enabling HSTS", () => {
    const headers = createSecurityHeaders({ isDevelopment: true });
    const policy = headers.find(
      ({ key }) => key === "Content-Security-Policy",
    )?.value;

    expect(policy).toContain("'unsafe-eval'");
    expect(policy).not.toContain("upgrade-insecure-requests");
    expect(headers).not.toContainEqual(
      expect.objectContaining({ key: "Strict-Transport-Security" }),
    );
  });

  it("hardens production transport and removes the development script source", () => {
    const headers = createSecurityHeaders();
    const policy = headers.find(
      ({ key }) => key === "Content-Security-Policy",
    )?.value;

    expect(policy).not.toContain("'unsafe-eval'");
    expect(policy).toContain("upgrade-insecure-requests");
    expect(headers).toContainEqual({
      key: "Strict-Transport-Security",
      value: "max-age=31536000",
    });
  });

  it("falls back to same-origin connections for an invalid API URL", () => {
    expect(createContentSecurityPolicy({ apiUrl: "not-a-url" })).toContain(
      "connect-src 'self';",
    );
  });
});
