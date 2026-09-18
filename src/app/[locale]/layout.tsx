import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";

import { SiteHeader } from "@/components/layout/site-header";
import { AppProviders } from "@/components/providers/app-providers";
import { getRouteLocale } from "@/i18n/params";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = await getRouteLocale(params);
  setRequestLocale(locale);
  const messages = await getMessages();
  const t = await getTranslations("Nav");

  return (
    <NextIntlClientProvider messages={messages}>
      <AppProviders key={locale}>
        <a
          href="#main-content"
          className="bg-background text-foreground focus:ring-ring fixed top-3 left-3 z-50 -translate-y-20 rounded-md border px-3 py-2 text-sm font-medium shadow-lg transition-transform focus:translate-y-0 focus:ring-2 focus:outline-none"
        >
          {t("skipToContent")}
        </a>
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main id="main-content" tabIndex={-1} className="flex-1">
            {children}
          </main>
        </div>
      </AppProviders>
    </NextIntlClientProvider>
  );
}
