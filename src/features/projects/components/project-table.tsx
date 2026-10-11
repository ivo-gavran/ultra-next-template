"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  DataTable,
  DataTableSortButton,
  type DataTableColumns,
  type DataTableFeatures,
} from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import type { Project, ProjectSort } from "@/features/projects/schemas";
import { getDateFormatLocale } from "@/lib/intl/date-locale";

type ProjectTableProps = {
  /** Id of the project whose delete request is in flight. */
  deletingProjectId: string | null;
  emptyState: ReactNode;
  isFetching: boolean;
  isLoading: boolean;
  /** Previous page rows remain visible while the requested page loads. */
  isPageTransition: boolean;
  locale: string;
  onDelete: (project: Project) => void;
  onEdit: (project: Project) => void;
  onSortChange: (sort: ProjectSort) => void;
  /** Keeps the placeholder row count in step with the requested page size. */
  pageSize: number;
  projects: Project[];
  sort: ProjectSort;
};

const columnHelper = createColumnHelper<DataTableFeatures, Project>();

export function ProjectTable({
  deletingProjectId,
  emptyState,
  isFetching,
  isLoading,
  isPageTransition,
  locale,
  onDelete,
  onEdit,
  onSortChange,
  pageSize,
  projects,
  sort,
}: ProjectTableProps) {
  const t = useTranslations("Projects");
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(getDateFormatLocale(locale), {
        dateStyle: "medium",
      }),
    [locale],
  );

  const columns = useMemo<DataTableColumns<Project>>(
    () => [
      columnHelper.accessor("name", {
        header: () => (
          <DataTableSortButton
            direction={
              sort === "name-asc"
                ? "ascending"
                : sort === "name-desc"
                  ? "descending"
                  : "none"
            }
            label={t("columnName")}
            onToggle={() =>
              onSortChange(sort === "name-asc" ? "name-desc" : "name-asc")
            }
          />
        ),
        meta: {
          cellClassName:
            "w-full whitespace-normal md:w-auto md:whitespace-nowrap",
          sortDirection:
            sort === "name-asc"
              ? "ascending"
              : sort === "name-desc"
                ? "descending"
                : "none",
        },
        cell: (info) => {
          const description = info.row.original.description;

          return (
            <div className="min-w-0">
              <span className="text-foreground font-medium">
                {info.getValue()}
              </span>
              {/* The description column is hidden on narrow screens, so the
                  text moves under the name instead of being squeezed. */}
              {description ? (
                <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-5 md:hidden">
                  {description}
                </p>
              ) : null}
            </div>
          );
        },
      }),
      columnHelper.accessor("description", {
        header: () => t("columnDescription"),
        meta: {
          cellClassName: "hidden max-w-[28rem] whitespace-normal md:table-cell",
          headerClassName: "hidden md:table-cell",
        },
        cell: (info) => {
          const description = info.getValue();

          return description ? (
            <span className="text-muted-foreground">{description}</span>
          ) : (
            <span
              className="text-muted-foreground/60"
              aria-label={t("noDescription")}
            >
              —
            </span>
          );
        },
      }),
      columnHelper.accessor("createdAt", {
        header: () => (
          <DataTableSortButton
            direction={
              sort === "createdAt-asc"
                ? "ascending"
                : sort === "createdAt-desc"
                  ? "descending"
                  : "none"
            }
            label={t("columnCreated")}
            onToggle={() =>
              onSortChange(
                sort === "createdAt-desc" ? "createdAt-asc" : "createdAt-desc",
              )
            }
          />
        ),
        meta: {
          sortDirection:
            sort === "createdAt-asc"
              ? "ascending"
              : sort === "createdAt-desc"
                ? "descending"
                : "none",
        },
        cell: (info) => (
          <time
            className="text-muted-foreground tabular-nums"
            dateTime={info.getValue()}
          >
            {dateFormatter.format(new Date(info.getValue()))}
          </time>
        ),
      }),
      columnHelper.accessor("updatedAt", {
        header: () => t("columnUpdated"),
        meta: {
          cellClassName: "hidden lg:table-cell",
          headerClassName: "hidden lg:table-cell",
        },
        cell: (info) => (
          <time
            className="text-muted-foreground tabular-nums"
            dateTime={info.getValue()}
          >
            {dateFormatter.format(new Date(info.getValue()))}
          </time>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: () => <span className="sr-only">{t("columnActions")}</span>,
        meta: { align: "end", cellClassName: "w-px" },
        cell: (info) => {
          const project = info.row.original;
          const isDeleting = deletingProjectId === project.id;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("rowActions", { name: project.name })}
                  disabled={isDeleting || isPageTransition}
                >
                  {isDeleting ? (
                    <Spinner />
                  ) : (
                    <MoreHorizontal aria-hidden="true" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onEdit(project)}>
                  <Pencil aria-hidden="true" />
                  {t("editAction")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => onDelete(project)}
                >
                  <Trash2 aria-hidden="true" />
                  {t("deleteAction")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      }),
    ],
    [
      dateFormatter,
      deletingProjectId,
      isPageTransition,
      onDelete,
      onEdit,
      onSortChange,
      sort,
      t,
    ],
  );

  return (
    <DataTable
      caption={t("tableCaption")}
      columns={columns}
      data={projects}
      emptyState={emptyState}
      getRowId={(project) => project.id}
      isFetching={isFetching}
      isLoading={isLoading}
      skeletonRows={pageSize}
    />
  );
}
