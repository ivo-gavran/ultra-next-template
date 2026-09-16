import { describe, expect, it } from "vitest";

import { signUpSchema } from "@/features/auth/schemas";

describe("signUpSchema", () => {
  it("normalizes email addresses", () => {
    const result = signUpSchema.parse({
      name: "Ada Lovelace",
      email: "  ADA@EXAMPLE.COM ",
      password: "correct-horse-battery-staple",
    });

    expect(result.email).toBe("ada@example.com");
  });
});
