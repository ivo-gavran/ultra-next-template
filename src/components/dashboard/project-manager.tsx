"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { ProjectCard } from "@/components/dashboard/project-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  createProjectSchema,
  type CreateProjectInput,
} from "@/features/projects/schemas";
import {
  useCreateProject,
  useDeleteProject,
  useProjects,
} from "@/features/projects/queries";

export function ProjectManager() {
  const locale = useLocale();
  const t = useTranslations("Dashboard");
  const projects = useProjects();
  const createMutation = useCreateProject();
  const deleteMutation = useDeleteProject();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: "", description: "" },
  });

  const onSubmit = handleSubmit(async (input) => {
    await createMutation.mutateAsync(input);
    reset();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("projectsTitle")}</CardTitle>
        <CardDescription>{t("projectsDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <form
          className="grid gap-4 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end"
          onSubmit={onSubmit}
        >
          <div className="space-y-2">
            <Label htmlFor="project-name">{t("name")}</Label>
            <Input
              id="project-name"
              placeholder={t("namePlaceholder")}
              aria-invalid={Boolean(errors.name)}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-destructive text-sm">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-description">{t("descriptionLabel")}</Label>
            <Input
              id="project-description"
              placeholder={t("descriptionPlaceholder")}
              {...register("description")}
            />
          </div>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending && <Spinner />}
            {createMutation.isPending ? t("creating") : t("create")}
          </Button>
        </form>

        {createMutation.isError && (
          <p
            role="alert"
            className="bg-destructive/10 text-destructive rounded-xl p-3 text-sm"
          >
            {createMutation.error.message}
          </p>
        )}

        <div className="space-y-3">
          {projects.isPending && (
            <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
              <Spinner /> {t("loading")}
            </div>
          )}
          {projects.isError && (
            <p
              role="alert"
              className="bg-destructive/10 text-destructive rounded-xl p-3 text-sm"
            >
              {t("loadError")}
            </p>
          )}
          {projects.data?.length === 0 && (
            <div className="border-border text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
              {t("empty")}
            </div>
          )}
          {projects.data?.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              locale={locale}
              deleteLabel={t("delete", { name: project.name })}
              isDeleting={deleteMutation.isPending}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
