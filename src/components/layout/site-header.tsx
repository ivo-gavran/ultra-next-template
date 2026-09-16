import { Atom } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export async function SiteHeader() {
  const [session, t] = await Promise.all([auth(), getTranslations("Nav")]);

  return (
    <header className="border-border/70 bg-background/85 sticky top-0 z-40 border-b backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-xl">
            <Atom className="size-4" />
          </span>
          {t("brand")}
        </Link>

        <nav className="flex items-center gap-1" aria-label="Main navigation">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
          >
            <Link href="/">{t("home")}</Link>
          </Button>
          {session?.user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">{t("dashboard")}</Link>
              </Button>
              <SignOutButton />
            </>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href="/sign-in">{t("signIn")}</Link>
            </Button>
          )}
          <LocaleSwitcher />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
