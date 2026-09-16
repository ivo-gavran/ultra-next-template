import type { $ZodErrorMap } from "zod/v4/core";

const validationFieldKeys = {
  description: "fields.description",
  email: "fields.email",
  name: "fields.name",
  password: "fields.password",
} as const;

type ValidationField = keyof typeof validationFieldKeys;

type ValidationTranslationKey =
  | (typeof validationFieldKeys)[ValidationField]
  | "fields.value"
  | "messages.email"
  | "messages.invalid"
  | "messages.maxLength"
  | "messages.minLength"
  | "messages.required";

export type ValidationTranslator = (
  key: ValidationTranslationKey,
  values?: Record<string, number | string>,
) => string;

function getFieldKey(pathItem: PropertyKey | undefined) {
  if (
    typeof pathItem === "string" &&
    Object.hasOwn(validationFieldKeys, pathItem)
  ) {
    return validationFieldKeys[pathItem as ValidationField];
  }

  return "fields.value" as const;
}

export function createValidationErrorMap(
  t: ValidationTranslator,
): $ZodErrorMap {
  return (issue) => {
    const field = t(getFieldKey(issue.path?.[0]));

    if (issue.code === "invalid_type") {
      return { message: t("messages.required", { field }) };
    }

    if (issue.code === "invalid_format" && issue.format === "email") {
      return { message: t("messages.email") };
    }

    if (issue.code === "too_small" && issue.origin === "string") {
      const min = Number(issue.minimum);
      return {
        message:
          min === 1
            ? t("messages.required", { field })
            : t("messages.minLength", { field, min }),
      };
    }

    if (issue.code === "too_big" && issue.origin === "string") {
      return {
        message: t("messages.maxLength", {
          field,
          max: Number(issue.maximum),
        }),
      };
    }

    return { message: t("messages.invalid", { field }) };
  };
}
