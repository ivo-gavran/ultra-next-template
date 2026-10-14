import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { siteConfig } from "@/config/site";
import { getRouteLocale } from "@/i18n/params";
import { createPageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await getRouteLocale(params);

  return createPageMetadata({
    absoluteTitle: true,
    description: siteConfig.localized[locale].description,
    locale,
    path: "/",
    title: siteConfig.name,
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await getRouteLocale(params);
  setRequestLocale(locale);
  const t = await getTranslations("Home");

  return (
    <section
      className="mx-auto flex min-h-[65vh] w-full max-w-3xl items-center px-5 py-16 sm:py-24"
      aria-labelledby="home-title"
    >
      <div className="min-w-0">
        <p className="text-primary text-sm font-medium break-words">
          {siteConfig.name}
        </p>
        <h1
          id="home-title"
          className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
        >
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-4 max-w-lg text-base leading-relaxed">
          {t("description")}
        </p>
      </div>
    </section>
  );
}
