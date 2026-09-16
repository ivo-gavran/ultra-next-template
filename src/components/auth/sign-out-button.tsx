"use client";

import { LogOut } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const locale = useLocale();
  const t = useTranslations("Nav");

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => signOut({ redirectTo: `/${locale}` })}
    >
      <LogOut className="size-4" />
      <span className="hidden sm:inline">{t("signOut")}</span>
    </Button>
  );
}
