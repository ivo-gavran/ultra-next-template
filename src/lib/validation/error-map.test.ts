import { describe, expect, it } from "vitest";

import { signUpSchema } from "@/features/auth/schemas";
import {
  createValidationErrorMap,
  type ValidationTranslationKey,
  type ValidationTranslationValues,
  type ValidationTranslator,
} from "@/lib/validation/error-map";

const translations = {
  "fields.description": "Description",
  "fields.email": "Email address",
  "fields.name": "Name",
  "fields.password": "Password",
  "fields.value": "Value",
  "messages.email": "Enter a valid email address.",
  "messages.invalid": "{field} is invalid.",
  "messages.maxLength": "{field} must contain at most {max} characters.",
  "messages.minLength": "{field} must contain at least {min} characters.",
  "messages.required": "{field} is required.",
} as const;

const translate = ((
  key: ValidationTranslationKey,
  values?: ValidationTranslationValues,
) =>
  Object.entries(values ?? {}).reduce<string>(
    (message, [name, value]) => message.replace(`{${name}}`, String(value)),
    translations[key] as string,
  )) as ValidationTranslator;

describe("createValidationErrorMap", () => {
  it("localizes field constraints without changing the shared schema", () => {
    const result = signUpSchema.safeParse(
      { name: "A", email: "invalid", password: "short" },
      { error: createValidationErrorMap(translate) },
    );

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.flatten().fieldErrors).toEqual({
      email: ["Enter a valid email address."],
      name: ["Name must contain at least 2 characters."],
      password: ["Password must contain at least 8 characters."],
    });
  });
});
