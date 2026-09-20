"use client";

import { useTranslations } from "next-intl";
import { ThemeProvider } from "next-themes";

import { ApiMockProvider } from "@/components/providers/api-mock-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { ToastProvider } from "@/components/ui/toast";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const t = useTranslations("Toast");

  return (
    <ApiMockProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ToastProvider dismissLabel={t("dismiss")}>
          <QueryProvider>{children}</QueryProvider>
        </ToastProvider>
      </ThemeProvider>
    </ApiMockProvider>
  );
}
