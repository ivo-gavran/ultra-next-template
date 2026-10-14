"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const t = useTranslations("Toast");
  const locale = useLocale();

  // The root layout persists during locale navigation. Keep the document
  // language in sync for screen readers after the client transition.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return (
    <NuqsAdapter>
      <QueryProvider>
        {children}
        <Toaster
          closeButton
          position="top-right"
          toastOptions={{ closeButtonAriaLabel: t("dismiss") }}
        />
      </QueryProvider>
    </NuqsAdapter>
  );
}
