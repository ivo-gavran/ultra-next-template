import { Atom } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { NavLink } from "@/components/layout/nav-link";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";

export async function SiteHeader() {
  const t = await getTranslations("Nav");

  return (
    <header className="border-border/70 bg-background/85 sticky top-0 z-40 border-b backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 font-semibold tracking-tight"
        >
          <span className="bg-primary text-primary-foreground grid size-8 shrink-0 place-items-center rounded-xl">
            <Atom aria-hidden="true" className="size-4" />
          </span>
          <span className="truncate">{siteConfig.shortName}</span>
        </Link>

        <nav
          className="flex shrink-0 items-center gap-1"
          aria-label={t("mainNavigation")}
        >
          <NavLink href="/" className="hidden sm:inline-flex">
            {t("home")}
          </NavLink>
          <span
            aria-hidden="true"
            className="bg-border mx-1.5 hidden h-5 w-px sm:block"
          />
          <LocaleSwitcher />
          <ThemeToggle label={t("toggleTheme")} />
        </nav>
      </div>
    </header>
  );
}
