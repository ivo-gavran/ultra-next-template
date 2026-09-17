import { hasLocale } from "next-intl";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { RouteStateShell } from "@/components/layout/route-state-shell";
import { EmptyState } from "@/components/ui/async-state";
import { Button } from "@/components/ui/button";
import { routing } from "@/i18n/routing";

export default async function NotFound() {
  const requestedLocale = await getLocale();
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "Resilience" });

  return (
    <RouteStateShell as="main">
      <EmptyState
        title={t("notFoundTitle")}
        description={t("notFoundDescription")}
      />
      <div className="mt-4 flex justify-center">
        <Button asChild>
          <Link href={`/${locale}`}>{t("backHome")}</Link>
        </Button>
      </div>
    </RouteStateShell>
  );
}
