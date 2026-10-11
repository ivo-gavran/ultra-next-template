"use client";

import { Languages, LoaderCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

import styles from "./switcher.module.css";

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Nav");
  const [isPending, startTransition] = useTransition();
  const nextLocale: AppLocale = locale === "en" ? "bs" : "en";

  function switchLocale() {
    const href = `${pathname}${window.location.search}${window.location.hash}`;

    startTransition(() => {
      router.replace(href, { locale: nextLocale, scroll: false });
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-busy={isPending}
      disabled={isPending}
      onClick={switchLocale}
    >
      {isPending ? (
        <LoaderCircle
          aria-hidden="true"
          className="size-4 motion-safe:animate-spin"
        />
      ) : (
        <Languages aria-hidden="true" className="size-4" />
      )}
      <span key={locale} className={styles.localeLabel}>
        {t("switchLanguage")}
      </span>
    </Button>
  );
}
