"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ProjectFormFields } from "@/features/projects/components/project-form-fields";
import { useCreateProject } from "@/features/projects/queries";
import {
  createProjectSchema,
  type CreateProjectInput,
} from "@/features/projects/schemas";
import { useValidationErrorMap } from "@/lib/validation/use-validation-error-map";

export function ProjectCreateForm({ onCreated }: { onCreated: () => void }) {
  const t = useTranslations("Projects");
  const mutation = useCreateProject();
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

  const onSubmit = handleSubmit((input) => {
    mutation.mutate(input, {
      onSuccess: () => {
        reset();
        onCreated();
      },
    });
  });

  return (
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
          <ProjectFormFields
            errors={errors}
            register={register}
            variant="create"
          />
          <div className="flex flex-col gap-2">
            {/* Match the label height so validation errors do not move the button. */}
            <span
              aria-hidden="true"
              className="hidden text-sm leading-snug font-medium select-none sm:block"
            >
              &nbsp;
            </span>
            <Button
              type="submit"
              className="h-9 px-4"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? <Spinner /> : <Plus aria-hidden="true" />}
              {mutation.isPending ? t("creating") : t("create")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
