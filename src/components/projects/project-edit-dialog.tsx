"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  updateProjectSchema,
  type Project,
  type UpdateProjectInput,
} from "@/features/projects/schemas";
import { useValidationErrorMap } from "@/lib/validation/use-validation-error-map";

type ProjectEditDialogProps = {
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: UpdateProjectInput) => void;
  project: Project | null;
};

export function ProjectEditDialog({
  isPending,
  onOpenChange,
  onSave,
  project,
}: ProjectEditDialogProps) {
  const t = useTranslations("Projects");
  const validationErrorMap = useValidationErrorMap();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateProjectInput>({
    resolver: zodResolver(updateProjectSchema, { error: validationErrorMap }),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (project) {
      reset({ name: project.name, description: project.description ?? "" });
    }
  }, [project, reset]);

  return (
    <Dialog open={Boolean(project)} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t("close")}>
        <DialogHeader>
          <DialogTitle>{t("editTitle")}</DialogTitle>
          <DialogDescription>{t("editDescription")}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={handleSubmit((input) => onSave(input))}
        >
          <FormField
            htmlFor="edit-project-name"
            label={t("name")}
            error={errors.name?.message}
          >
            <Input
              id="edit-project-name"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={
                errors.name ? "edit-project-name-error" : undefined
              }
              {...register("name")}
            />
          </FormField>
          <FormField
            htmlFor="edit-project-description"
            label={t("descriptionLabel")}
            error={errors.description?.message}
          >
            <Textarea
              id="edit-project-description"
              aria-invalid={Boolean(errors.description)}
              aria-describedby={
                errors.description
                  ? "edit-project-description-error"
                  : undefined
              }
              {...register("description")}
            />
          </FormField>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t("cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner />}
              {isPending ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
