"use client";

import { useLocale, useTranslations } from "next-intl";
import { useQueryStates } from "nuqs";
import { useCallback, useState } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState, ErrorState } from "@/components/ui/async-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ProjectCreateForm } from "@/features/projects/components/project-create-form";
import { ProjectSearchField } from "@/features/projects/components/project-search-field";
import { ProjectDashboard } from "@/features/projects/components/project-dashboard";
import { ProjectEditDialog } from "@/features/projects/components/project-edit-dialog";
import { ProjectsPagination } from "@/features/projects/components/projects-pagination";
import { ProjectTable } from "@/features/projects/components/project-table";
import { projectListFilterParsers } from "@/features/projects/filters";
import {
  useDeleteProject,
  useProjects,
  useUpdateProject,
} from "@/features/projects/queries";
import {
  type Project,
  type ProjectListFilters,
  type ProjectSort,
  type UpdateProjectInput,
} from "@/features/projects/schemas";

export function ProjectsView() {
  const locale = useLocale();
  const t = useTranslations("Projects");
  const [filters, setFilters] = useQueryStates(projectListFilterParsers, {
    history: "replace",
    shallow: true,
    scroll: false,
    clearOnDefault: true,
  });
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const projects = useProjects(filters);
  const updateMutation = useUpdateProject(filters);
  const deleteMutation = useDeleteProject(filters);

  const replaceFilters = useCallback(
    (updates: Partial<ProjectListFilters>) => {
      void setFilters(updates);
    },
    [setFilters],
  );

  const changeSort = useCallback(
    (sort: ProjectSort) => replaceFilters({ sort, page: 1 }),
    [replaceFilters],
  );

  const changeSearch = useCallback(
    (search: string) => replaceFilters({ search, page: 1 }),
    [replaceFilters],
  );

  const saveProject = (input: UpdateProjectInput) => {
    if (!editingProject) return;
    updateMutation.mutate(
      { id: editingProject.id, ...input },
      { onSuccess: () => setEditingProject(null) },
    );
  };

  const confirmDelete = () => {
    if (!deletingProject) return;
    const shouldMoveToPreviousPage =
      projects.data?.items.length === 1 && filters.page > 1;
    deleteMutation.mutate(deletingProject.id, {
      onSuccess: () => {
        setDeletingProject(null);
        if (shouldMoveToPreviousPage) {
          replaceFilters({ page: filters.page - 1 });
        }
      },
    });
  };

  const page = projects.data;
  const hasLoadError = projects.isError && !page;

  return (
    <div className="space-y-8">
      <ProjectDashboard />

      <ProjectCreateForm
        onCreated={() => replaceFilters({ search: "", page: 1 })}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("tableTitle")}</CardTitle>
          <CardDescription>{t("tableDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <ProjectSearchField
              key={filters.search}
              currentSearch={filters.search}
              onCommit={changeSearch}
            />
            {page && page.total > 0 && (
              <p
                className="text-muted-foreground pb-2 text-sm"
                aria-live="polite"
              >
                {t("resultCount", { count: page.total })}
              </p>
            )}
          </div>

          <div aria-busy={projects.isFetching} className="space-y-4">
            {hasLoadError ? (
              <ErrorState
                title={t("loadError")}
                retryLabel={t("retry")}
                onRetry={() => void projects.refetch()}
              />
            ) : (
              <ProjectTable
                deletingProjectId={
                  deleteMutation.isPending
                    ? (deleteMutation.variables ?? null)
                    : null
                }
                emptyState={
                  <EmptyState
                    className="border-0"
                    title={filters.search ? t("noResults") : t("empty")}
                  />
                }
                isFetching={projects.isFetching}
                isLoading={projects.isPending}
                isPageTransition={projects.isPlaceholderData}
                locale={locale}
                onDelete={setDeletingProject}
                onEdit={setEditingProject}
                onSortChange={changeSort}
                pageSize={filters.pageSize}
                projects={page?.items ?? []}
                sort={filters.sort}
              />
            )}

            {page && page.totalPages > 1 && (
              <ProjectsPagination
                currentPage={page.page}
                totalPages={page.totalPages}
                label={t("paginationLabel")}
                previousLabel={t("previous")}
                disabled={projects.isPlaceholderData}
                nextLabel={t("next")}
                pageLabel={t("page", {
                  current: String(page.page),
                  total: String(page.totalPages),
                })}
                onPageChange={(nextPage) => replaceFilters({ page: nextPage })}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <ProjectEditDialog
        project={editingProject}
        isPending={updateMutation.isPending}
        onOpenChange={(open) => !open && setEditingProject(null)}
        onSave={saveProject}
      />

      <AlertDialog
        open={Boolean(deletingProject)}
        onOpenChange={(open) => !open && setDeletingProject(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDescription", { name: deletingProject?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={confirmDelete}
            >
              {deleteMutation.isPending && <Spinner />}
              {deleteMutation.isPending ? t("deleting") : t("confirmDelete")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
