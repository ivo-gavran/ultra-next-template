"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";

import { getErrorMessageKey } from "@/lib/errors/messages";

export function useErrorMessage() {
  const t = useTranslations("Errors");

  return useCallback((error: unknown) => t(getErrorMessageKey(error)), [t]);
}
