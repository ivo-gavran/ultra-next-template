"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { publicEnv } from "@/config/public-env";

// MSW's browser entry cannot be imported during server rendering.
const ApiMockProvider = dynamic(
  () => import("./api-mock-provider").then((module) => module.ApiMockProvider),
  { ssr: false },
);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const t = useTranslations("Toast");
  const content = (
    <QueryProvider>
      {children}
      <Toaster
        closeButton
        position="top-right"
        toastOptions={{ closeButtonAriaLabel: t("dismiss") }}
      />
    </QueryProvider>
  );

  return (
    <NuqsAdapter>
      {publicEnv.NEXT_PUBLIC_API_MOCKING === "enabled" ? (
        <ApiMockProvider>{content}</ApiMockProvider>
      ) : (
        content
      )}
    </NuqsAdapter>
  );
}
