"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import {
  createValidationErrorMap,
  type ValidationTranslator,
} from "@/lib/validation/error-map";

export function useValidationErrorMap() {
  const t = useTranslations("Validation");

  const errorMap = useMemo(() => {
    const translate: ValidationTranslator = (key, values) => t(key, values);
    return createValidationErrorMap(translate);
  }, [t]);

  return errorMap;
}
