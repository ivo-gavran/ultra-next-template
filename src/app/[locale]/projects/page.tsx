import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { LoadingState } from "@/components/ui/async-state";
import { Badge } from "@/components/ui/badge";
import { ProjectsView } from "@/features/projects/components/projects-view";
import { getRouteLocale } from "@/i18n/params";
import { createPageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await getRouteLocale(params);
  const t = await getTranslations({ locale, namespace: "Projects" });

  return createPageMetadata({
    description: t("projectsDescription"),
    locale,
    path: "/projects",
    title: t("projectsTitle"),
  });
}

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await getRouteLocale(params);
  setRequestLocale(locale);
  const t = await getTranslations("Projects");

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <header className="border-border mb-10 border-b pb-8">
        <Badge variant="secondary" className="h-6 px-2.5">
          {t("eyebrow")}
        </Badge>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-3 max-w-2xl leading-7">
          {t("description")}
        </p>
      </header>
      <Suspense fallback={<LoadingState label={t("loading")} />}>
        <ProjectsView />
      </Suspense>
    </div>
  );
}
