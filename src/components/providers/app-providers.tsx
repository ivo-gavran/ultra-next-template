"use client";

import { useTranslations } from "next-intl";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { ApiMockProvider } from "@/components/providers/api-mock-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const t = useTranslations("Toast");

  return (
    <NuqsAdapter>
      <ApiMockProvider>
        <QueryProvider>
          {children}
          <Toaster
            closeButton
            position="top-right"
            toastOptions={{ closeButtonAriaLabel: t("dismiss") }}
          />
        </QueryProvider>
      </ApiMockProvider>
    </NuqsAdapter>
  );
}
