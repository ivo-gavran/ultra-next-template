"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useTranslations } from "next-intl";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

import { ToastProvider, useToast } from "@/components/ui/toast";
import { useErrorMessage } from "@/lib/errors/use-error-message";
import { createQueryClient } from "@/lib/query/client";

function QueryProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  const getErrorMessage = useErrorMessage();
  const [queryClient] = useState(() =>
    createQueryClient({
      notifyError: (error) => toast.error(getErrorMessage(error)),
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const t = useTranslations("Toast");

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ToastProvider dismissLabel={t("dismiss")}>
        <QueryProvider>{children}</QueryProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
