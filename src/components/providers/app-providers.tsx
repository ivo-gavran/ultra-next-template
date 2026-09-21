"use client";

import { useTranslations } from "next-intl";

import { ApiMockProvider } from "@/components/providers/api-mock-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const t = useTranslations("Toast");

  return (
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
  );
}
