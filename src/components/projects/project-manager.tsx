"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { ProjectCard } from "@/components/projects/project-card";
import { ProjectEditDialog } from "@/components/projects/project-edit-dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/async-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  readProjectListFilters,
  writeProjectListFilters,
} from "@/features/projects/filters";
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

export function ProjectManager() {
  const locale = useLocale();
  const t = useTranslations("Projects");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const serializedSearchParams = searchParams.toString();
  const filters = useMemo(
    () => readProjectListFilters(new URLSearchParams(serializedSearchParams)),
    [serializedSearchParams],
  );
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
      const nextSearchParams = writeProjectListFilters(
        new URLSearchParams(serializedSearchParams),
        { ...filters, ...updates },
      );
      const query = nextSearchParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [filters, pathname, router, serializedSearchParams],
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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("projectsTitle")}</CardTitle>
          <CardDescription>{t("projectsDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <form
            className="grid gap-4 sm:grid-cols-[1fr_1.5fr_auto] sm:items-start"
            onSubmit={onSubmit}
          >
            <FormField
              htmlFor="project-name"
              label={t("name")}
              error={errors.name?.message}
            >
              <Input
                id="project-name"
                placeholder={t("namePlaceholder")}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={
                  errors.name ? "project-name-error" : undefined
                }
                {...register("name")}
              />
            </FormField>
            <FormField
              htmlFor="project-description"
              label={t("descriptionLabel")}
              error={errors.description?.message}
            >
              <Textarea
                id="project-description"
                className="min-h-9"
                rows={1}
                placeholder={t("descriptionPlaceholder")}
                aria-invalid={Boolean(errors.description)}
                aria-describedby={
                  errors.description ? "project-description-error" : undefined
                }
                {...register("description")}
              />
            </FormField>
            <Button
              type="submit"
              className="sm:mt-7"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending && <Spinner />}
              {createMutation.isPending ? t("creating") : t("create")}
            </Button>
          </form>

          <div className="border-border grid gap-4 border-y py-5 sm:grid-cols-[1fr_15rem]">
            <ProjectSearchField
              key={filters.search}
              currentSearch={filters.search}
              label={t("searchLabel")}
              placeholder={t("searchPlaceholder")}
              onCommit={(search) => replaceFilters({ search, page: 1 })}
            />
            <FormField htmlFor="project-sort" label={t("sortLabel")}>
              <Select
                value={filters.sort}
                onValueChange={(value) =>
                  replaceFilters({ sort: value as ProjectSort, page: 1 })
                }
              >
                <SelectTrigger id="project-sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt-desc">{t("newest")}</SelectItem>
                  <SelectItem value="createdAt-asc">{t("oldest")}</SelectItem>
                  <SelectItem value="name-asc">{t("nameAscending")}</SelectItem>
                  <SelectItem value="name-desc">
                    {t("nameDescending")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="space-y-3" aria-busy={projects.isFetching}>
            {projects.isPending && <LoadingState label={t("loading")} />}
            {projects.isError && !projects.data && (
              <ErrorState
                title={t("loadError")}
                retryLabel={t("retry")}
                onRetry={() => void projects.refetch()}
              />
            )}
            {page?.items.length === 0 && (
              <EmptyState
                title={filters.search ? t("noResults") : t("empty")}
              />
            )}
            {page && page.total > 0 && (
              <p className="text-muted-foreground text-sm" aria-live="polite">
                {t("resultCount", { count: page.total })}
              </p>
            )}
            {page?.items.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                locale={locale}
                editLabel={t("edit", { name: project.name })}
                deleteLabel={t("delete", { name: project.name })}
                isDeleting={
                  deleteMutation.isPending &&
                  deleteMutation.variables === project.id
                }
                onEdit={setEditingProject}
                onDelete={() => setDeletingProject(project)}
              />
            ))}
            {page && page.totalPages > 1 && (
              <Pagination
                currentPage={page.page}
                totalPages={page.totalPages}
                label={t("paginationLabel")}
                previousLabel={t("previous")}
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
            <AlertDialogCancel asChild>
              <Button type="button" variant="outline">
                {t("cancel")}
              </Button>
            </AlertDialogCancel>
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
    </>
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
    <FormField htmlFor="project-search" label={label}>
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          id="project-search"
          type="search"
          className="pl-9"
          value={value}
          placeholder={placeholder}
          onChange={(event) => setValue(event.target.value)}
        />
      </div>
    </FormField>
  );
}
