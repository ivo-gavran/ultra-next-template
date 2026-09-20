import {
  ArrowRight,
  Braces,
  Check,
  Gauge,
  Languages,
  Layers3,
  Palette,
  ShieldCheck,
} from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CodePreview } from "@/components/home/code-preview";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { getRouteLocale } from "@/i18n/params";
import { createPageMetadata } from "@/lib/metadata";

const stack = [
  "Next.js",
  "React",
  "TypeScript",
  "Tailwind CSS",
  "shadcn/ui",
  "TanStack Query",
  "Zod",
  "React Hook Form",
  "next-intl",
  "MSW",
  "Vitest",
  "Playwright",
  "Storybook",
];

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

  const highlights = [
    t("highlightTyped"),
    t("highlightMocked"),
    t("highlightLocalized"),
  ];

  const features = [
    { icon: Braces, title: t("apiTitle"), description: t("apiDescription") },
    {
      icon: Layers3,
      title: t("clientTitle"),
      description: t("clientDescription"),
    },
    {
      icon: ShieldCheck,
      title: t("qualityTitle"),
      description: t("qualityDescription"),
    },
    {
      icon: Languages,
      title: t("i18nTitle"),
      description: t("i18nDescription"),
    },
    {
      icon: Palette,
      title: t("designTitle"),
      description: t("designDescription"),
    },
    {
      icon: Gauge,
      title: t("performanceTitle"),
      description: t("performanceDescription"),
    },
  ];

  const steps = [
    {
      command: "pnpm install",
      title: t("stepInstallTitle"),
      description: t("stepInstallDescription"),
    },
    {
      command: "pnpm run setup",
      title: t("stepSetupTitle"),
      description: t("stepSetupDescription"),
    },
    {
      command: "pnpm dev",
      title: t("stepDevTitle"),
      description: t("stepDevDescription"),
    },
  ];

  return (
    <div className="relative overflow-hidden">
      <div className="hero-grid absolute inset-x-0 top-0 -z-10 h-[52rem] opacity-60" />

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-16 pb-16 sm:pt-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pt-28 lg:pb-20">
        <div className="flex min-w-0 flex-col items-start">
          <p className="border-primary/25 bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full border py-1.5 pr-4 pl-2.5 text-sm font-medium">
            <span className="relative flex size-2">
              <span className="bg-primary/60 absolute inline-flex size-full rounded-full motion-safe:animate-ping" />
              <span className="bg-primary relative inline-flex size-2 rounded-full" />
            </span>
            {t("eyebrow")}
          </p>
          <h1 className="mt-6 max-w-xl text-5xl font-semibold tracking-[-0.045em] text-balance sm:text-6xl">
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-6 max-w-xl text-lg leading-8 text-pretty">
            {t("description")}
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-11 px-6 text-base">
              <Link href="/projects">
                {t("primaryCta")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-11 px-6 text-base"
            >
              <a href="#stack">{t("secondaryCta")}</a>
            </Button>
          </div>
          <ul className="text-muted-foreground mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm">
            {highlights.map((highlight) => (
              <li key={highlight} className="flex items-center gap-2">
                <Check className="text-primary size-4" aria-hidden="true" />
                {highlight}
              </li>
            ))}
          </ul>
        </div>

        <figure
          aria-label={t("codePreviewLabel")}
          className="relative w-full min-w-0 lg:justify-self-end"
        >
          <div
            aria-hidden="true"
            className="from-primary/30 via-chart-2/20 absolute -inset-6 -z-10 rounded-[2rem] bg-linear-to-br to-transparent blur-2xl"
          />
          <CodePreview />
          <figcaption className="text-muted-foreground mt-4 text-center text-sm">
            {t("codePreviewCaption")}
          </figcaption>
        </figure>
      </section>

      {/* Stack strip */}
      <section
        aria-label={t("stackLabel")}
        className="border-border/70 border-y"
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 py-8 lg:flex-row lg:gap-8">
          <p className="text-muted-foreground shrink-0 text-xs font-semibold tracking-[0.18em] uppercase">
            {t("stackLabel")}
          </p>
          <ul className="flex flex-wrap justify-center gap-2 lg:justify-start">
            {stack.map((item) => (
              <li
                key={item}
                className="bg-muted/60 text-foreground/80 rounded-md border px-2.5 py-1 font-mono text-xs"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Features */}
      <section id="stack" className="mx-auto max-w-6xl px-5 py-24 sm:py-28">
        <div className="max-w-2xl">
          <p className="text-primary text-sm font-semibold tracking-[0.18em] uppercase">
            {t("stackEyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {t("stackTitle")}
          </h2>
          <p className="text-muted-foreground mt-4 text-lg leading-8 text-pretty">
            {t("stackDescription")}
          </p>
        </div>

        <ul className="bg-border mt-12 grid gap-px overflow-hidden rounded-2xl border sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }, index) => (
            <li
              key={title}
              className="group bg-card hover:bg-accent/40 relative flex flex-col p-7 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground grid size-10 place-items-center rounded-xl transition-colors">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="text-muted-foreground font-mono text-xs tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-6 text-lg font-semibold tracking-tight">
                {title}
              </h3>
              <p className="text-muted-foreground mt-2 leading-7">
                {description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Quick start */}
      <section className="bg-muted/40 border-border/70 border-y">
        <div className="mx-auto max-w-6xl px-5 py-24 sm:py-28">
          <div className="max-w-2xl">
            <p className="text-primary text-sm font-semibold tracking-[0.18em] uppercase">
              {t("workflowEyebrow")}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {t("workflowTitle")}
            </h2>
            <p className="text-foreground/70 mt-4 text-lg leading-8">
              {t("workflowDescription")}
            </p>
          </div>

          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map(({ command, title, description }, index) => (
              <li
                key={command}
                className="bg-card relative flex flex-col rounded-2xl border p-7 shadow-xs"
              >
                <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-full text-sm font-semibold tabular-nums">
                  {index + 1}
                </span>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">
                  {title}
                </h3>
                <p className="text-muted-foreground mt-2 flex-1 leading-7">
                  {description}
                </p>
                <code className="bg-muted mt-6 block rounded-lg border px-4 py-3 font-mono text-sm">
                  <span aria-hidden="true" className="text-primary">
                    ${" "}
                  </span>
                  {command}
                </code>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-6xl px-5 py-24 sm:py-28">
        <div className="bg-foreground text-background relative overflow-hidden rounded-3xl px-7 py-14 sm:px-14 sm:py-20">
          <div
            aria-hidden="true"
            className="bg-primary/40 absolute -top-32 -right-24 size-96 rounded-full blur-3xl"
          />
          <div
            aria-hidden="true"
            className="bg-chart-2/25 absolute -bottom-40 -left-16 size-80 rounded-full blur-3xl"
          />
          <div className="relative flex flex-col items-start gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
                {t("ctaTitle")}
              </h2>
              <p className="text-background/75 mt-5 text-lg leading-8 text-pretty">
                {t("ctaDescription")}
              </p>
            </div>
            <Button asChild size="lg" className="h-12 shrink-0 px-7 text-base">
              <Link href="/projects">
                {t("ctaButton")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-border/70 border-t">
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm sm:flex-row">
          <p className="text-foreground font-semibold tracking-tight">
            {siteConfig.name}
          </p>
          <p>{t("footerNote")}</p>
        </div>
      </footer>
    </div>
  );
}
