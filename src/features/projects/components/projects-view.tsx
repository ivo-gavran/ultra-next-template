"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useQueryStates } from "nuqs";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { ProjectDashboard } from "@/features/projects/components/project-dashboard";
import { ProjectEditDialog } from "@/features/projects/components/project-edit-dialog";
import { ProjectsPagination } from "@/features/projects/components/projects-pagination";
import { ProjectTable } from "@/features/projects/components/project-table";
import { projectListFilterParsers } from "@/features/projects/filters";
import {
  useCreateProject,
  useDeleteProject,
  useProjects,
  useUpdateProject,
} from "@/features/projects/queries";
import {
  createProjectSchema,
  type CreateProjectInput,
  type Project,
  type ProjectListFilters,
  type ProjectSort,
  type UpdateProjectInput,
} from "@/features/projects/schemas";
import { useValidationErrorMap } from "@/lib/validation/use-validation-error-map";

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
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject(filters);
  const deleteMutation = useDeleteProject(filters);
  const validationErrorMap = useValidationErrorMap();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema, { error: validationErrorMap }),
    defaultValues: { name: "", description: "" },
  });

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

  const onSubmit = handleSubmit((input) => {
    createMutation.mutate(input, {
      onSuccess: () => {
        reset();
        replaceFilters({ search: "", page: 1 });
      },
    });
  });

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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("createTitle")}</CardTitle>
          <CardDescription>{t("createDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-[1fr_1.5fr_auto] sm:items-start"
            onSubmit={onSubmit}
          >
            <Field data-invalid={Boolean(errors.name)}>
              <FieldLabel htmlFor="project-name">{t("name")}</FieldLabel>
              <Input
                id="project-name"
                className="h-9"
                placeholder={t("namePlaceholder")}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={
                  errors.name ? "project-name-error" : undefined
                }
                {...register("name")}
              />
              <FieldError id="project-name-error">
                {errors.name?.message}
              </FieldError>
            </Field>
            <Field data-invalid={Boolean(errors.description)}>
              <FieldLabel htmlFor="project-description">
                {t("descriptionLabel")}
              </FieldLabel>
              <Textarea
                id="project-description"
                className="min-h-9 py-[7px] leading-5"
                rows={1}
                placeholder={t("descriptionPlaceholder")}
                aria-invalid={Boolean(errors.description)}
                aria-describedby={
                  errors.description ? "project-description-error" : undefined
                }
                {...register("description")}
              />
              <FieldError id="project-description-error">
                {errors.description?.message}
              </FieldError>
            </Field>
            {/* An invisible label line keeps the button level with the inputs,
                even when a validation message grows a field below it. */}
            <div className="flex flex-col gap-2">
              <span
                aria-hidden="true"
                className="hidden text-sm leading-snug font-medium select-none sm:block"
              >
                &nbsp;
              </span>
              <Button
                type="submit"
                className="h-9 px-4"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <Spinner />
                ) : (
                  <Plus aria-hidden="true" />
                )}
                {createMutation.isPending ? t("creating") : t("create")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

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
              label={t("searchLabel")}
              placeholder={t("searchPlaceholder")}
              onCommit={(search) => replaceFilters({ search, page: 1 })}
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

type ProjectSearchFieldProps = {
  currentSearch: string;
  label: string;
  onCommit: (search: string) => void;
  placeholder: string;
};

function ProjectSearchField({
  currentSearch,
  label,
  onCommit,
  placeholder,
}: ProjectSearchFieldProps) {
  const [value, setValue] = useState(currentSearch);

  useEffect(() => {
    const normalizedSearch = value.trim();
    if (normalizedSearch === currentSearch) return;

    const timer = window.setTimeout(() => onCommit(normalizedSearch), 300);
    return () => window.clearTimeout(timer);
  }, [currentSearch, onCommit, value]);

  return (
    <Field className="sm:w-auto">
      <FieldLabel htmlFor="project-search">{label}</FieldLabel>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        />
        <Input
          id="project-search"
          type="search"
          className="h-9 w-full pl-9 sm:w-80"
          value={value}
          maxLength={80}
          placeholder={placeholder}
          onChange={(event) => setValue(event.target.value)}
        />
      </div>
    </Field>
  );
}
