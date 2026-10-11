"use client";

import {
  CalendarPlus,
  FileText,
  FolderKanban,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";

import { ErrorState } from "@/components/ui/async-state";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjectsSummary } from "@/features/projects/queries";

export function ProjectDashboard() {
  const locale = useLocale();
  const t = useTranslations("Projects");
  const summary = useProjectsSummary();
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(locale),
    [locale],
  );
  const formatStat = (value: number | undefined) =>
    value === undefined ? undefined : numberFormatter.format(value);

  if (summary.isError && !summary.data) {
    return (
      <ErrorState
        title={t("summaryError")}
        retryLabel={t("retry")}
        onRetry={() => void summary.refetch()}
      />
    );
  }

  const data = summary.data;
  const documentedPercent =
    data && data.total > 0
      ? Math.round((data.documented / data.total) * 100)
      : 0;

  return (
    <section
      className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
      aria-busy={summary.isPending}
      aria-label={t("overviewTitle")}
    >
      <SummaryStat
        hint={t("statTotalHint")}
        icon={FolderKanban}
        label={t("statTotal")}
        value={formatStat(data?.total)}
      />
      <SummaryStat
        hint={t("statCreatedHint")}
        icon={CalendarPlus}
        label={t("statCreated")}
        value={formatStat(data?.createdLast30Days)}
      />
      <SummaryStat
        hint={t("statUpdatedHint")}
        icon={RefreshCw}
        label={t("statUpdated")}
        value={formatStat(data?.updatedLast7Days)}
      />
      <SummaryStat
        hint={t("statDocumentedHint", {
          percent: numberFormatter.format(documentedPercent),
        })}
        icon={FileText}
        label={t("statDocumented")}
        value={formatStat(data?.documented)}
      />
    </section>
  );
}

type SummaryStatProps = {
  hint: string;
  icon: LucideIcon;
  label: string;
  /** Undefined while the summary is loading, which renders a placeholder. */
  value: string | undefined;
};

function SummaryStat({ hint, icon: Icon, label, value }: SummaryStatProps) {
  return (
    <Card className="gap-0 py-4 sm:py-5">
      <CardContent className="px-4 sm:px-5">
        {/* A description list ties each label to its value for screen readers. */}
        <dl>
          <dt className="text-muted-foreground flex items-start gap-2 text-sm leading-5">
            <span className="bg-primary/10 text-primary hidden size-5 shrink-0 place-items-center rounded-md sm:grid">
              <Icon aria-hidden="true" className="size-3.5" />
            </span>
            {label}
          </dt>
          <dd className="mt-2 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
            {value === undefined ? (
              <Skeleton className="h-8 w-12 sm:h-9" />
            ) : (
              value
            )}
          </dd>
        </dl>
        <p className="text-muted-foreground mt-1.5 text-xs leading-4">{hint}</p>
      </CardContent>
    </Card>
  );
}
