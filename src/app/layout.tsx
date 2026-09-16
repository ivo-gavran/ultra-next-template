import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Ultra Next", template: "%s · Ultra Next" },
  description:
    "A production-minded Next.js starter with auth, PostgreSQL, Drizzle, i18n and a complete quality toolchain.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
