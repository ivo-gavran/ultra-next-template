import { ArrowRight, Database, Layers3, ShieldCheck } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getRouteLocale } from "@/i18n/params";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await getRouteLocale(params);
  setRequestLocale(locale);
  const t = await getTranslations("Home");

  const features = [
    {
      icon: Database,
      title: t("serverTitle"),
      description: t("serverDescription"),
    },
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
  ];

  return (
    <div className="relative overflow-hidden">
      <div className="hero-grid absolute inset-0 -z-10 opacity-50" />
      <section className="mx-auto flex max-w-6xl flex-col items-center px-5 pt-24 pb-20 text-center sm:pt-32">
        <p className="border-primary/25 bg-primary/10 text-primary mb-5 rounded-full border px-4 py-1.5 text-sm font-medium">
          {t("eyebrow")}
        </p>
        <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.045em] text-balance sm:text-7xl">
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-6 max-w-2xl text-lg leading-8 text-pretty">
          {t("description")}
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/dashboard">
              {t("primaryCta")}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/sign-up">{t("secondaryCta")}</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24">
        <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight">
          {t("stackTitle")}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="bg-card/80 backdrop-blur">
              <CardHeader>
                <span className="bg-primary/10 text-primary mb-3 grid size-10 place-items-center rounded-xl">
                  <Icon className="size-5" />
                </span>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-7">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
