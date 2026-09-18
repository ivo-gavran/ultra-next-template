"use client";

import { useTranslations } from "next-intl";

import { RouteStateShell } from "@/components/layout/route-state-shell";
import { LoadingState } from "@/components/ui/async-state";

export default function ProjectsLoading() {
  const t = useTranslations("Resilience");

  return (
    <RouteStateShell>
      <LoadingState label={t("loadingPage")} />
    </RouteStateShell>
  );
}
