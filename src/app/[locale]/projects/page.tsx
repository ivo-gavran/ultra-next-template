import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ProjectManager } from "@/components/projects/project-manager";
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
    <section className="mx-auto max-w-5xl px-5 py-16">
      <p className="text-primary text-sm font-semibold tracking-[0.18em] uppercase">
        {t("eyebrow")}
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
        {t("title")}
      </h1>
      <p className="text-muted-foreground mt-4 mb-10 max-w-2xl text-lg leading-8">
        {t("description")}
      </p>
      <ProjectManager />
    </section>
  );
}
