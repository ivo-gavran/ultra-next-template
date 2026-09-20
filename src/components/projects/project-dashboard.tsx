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
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
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
    <Card className="gap-0 py-5">
      <CardContent className="px-5">
        {/* A description list ties each label to its value for screen readers. */}
        <dl>
          <dt className="text-muted-foreground flex items-center gap-2 text-sm">
            <Icon aria-hidden="true" className="size-4" />
            {label}
          </dt>
          <dd className="mt-2 text-3xl font-semibold tabular-nums">
            {value === undefined ? <Skeleton className="h-9 w-12" /> : value}
          </dd>
        </dl>
        <p className="text-muted-foreground mt-2 text-xs">{hint}</p>
      </CardContent>
    </Card>
  );
}
