"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

export function LocaleSwitcher() {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Nav");
  const nextLocale: AppLocale = locale === "en" ? "bs" : "en";

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => router.replace(pathname, { locale: nextLocale })}
    >
      <Languages className="size-4" />
      {t("switchLanguage")}
    </Button>
  );
}
