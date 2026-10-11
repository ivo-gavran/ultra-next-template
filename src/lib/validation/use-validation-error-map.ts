"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import {
  createValidationErrorMap,
  type ValidationTranslationKey,
  type ValidationTranslationValues,
  type ValidationTranslator,
} from "@/lib/validation/error-map";

export function useValidationErrorMap() {
  const t = useTranslations("Validation");

  return useMemo(() => {
    const translate: ValidationTranslator = (
      key: ValidationTranslationKey,
      values?: ValidationTranslationValues,
    ) => {
      const field = String(values?.field ?? "");

      switch (key) {
        case "messages.invalid":
        case "messages.required":
          return t(key, { field });
        case "messages.maxLength":
          return t(key, { field, max: Number(values?.max ?? 0) });
        case "messages.minLength":
          return t(key, { field, min: Number(values?.min ?? 0) });
        default:
          return t(key);
      }
    };

    return createValidationErrorMap(translate);
  }, [t]);
}
