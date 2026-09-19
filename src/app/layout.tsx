import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import { WebVitals } from "@/components/providers/web-vitals";

import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Ultra Next", template: "%s · Ultra Next" },
  description:
    "A production-minded Next.js frontend starter with typed API boundaries, query state, i18n and a complete quality toolchain.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html lang={locale} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="bg-background text-foreground min-h-screen font-sans antialiased">
        <WebVitals />
        {children}
      </body>
    </html>
  );
}
