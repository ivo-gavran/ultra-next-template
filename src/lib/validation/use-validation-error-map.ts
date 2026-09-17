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

  const errorMap = useMemo(() => {
    const translate: ValidationTranslator = (
      key: ValidationTranslationKey,
      values?: ValidationTranslationValues,
    ) => {
      if (key === "messages.invalid" || key === "messages.required") {
        return t(key, { field: String(values?.field ?? "") });
      }

      if (key === "messages.maxLength") {
        return t(key, {
          field: String(values?.field ?? ""),
          max: Number(values?.max ?? 0),
        });
      }

      if (key === "messages.minLength") {
        return t(key, {
          field: String(values?.field ?? ""),
          min: Number(values?.min ?? 0),
        });
      }

      return t(key);
    };
    return createValidationErrorMap(translate);
  }, [t]);

  return errorMap;
}
