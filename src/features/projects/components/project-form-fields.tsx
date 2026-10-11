"use client";

import { useTranslations } from "next-intl";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CreateProjectInput } from "@/features/projects/schemas";

type ProjectFormFieldsProps = {
  errors: FieldErrors<CreateProjectInput>;
  register: UseFormRegister<CreateProjectInput>;
  variant: "create" | "edit";
};

export function ProjectFormFields({
  errors,
  register,
  variant,
}: ProjectFormFieldsProps) {
  const t = useTranslations("Projects");
  const isCreate = variant === "create";
  const prefix = isCreate ? "project" : "edit-project";
  const nameId = `${prefix}-name`;
  const descriptionId = `${prefix}-description`;

  return (
    <>
      <Field data-invalid={Boolean(errors.name)}>
        <FieldLabel htmlFor={nameId}>{t("name")}</FieldLabel>
        <Input
          id={nameId}
          className={isCreate ? "h-9" : undefined}
          placeholder={isCreate ? t("namePlaceholder") : undefined}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? `${nameId}-error` : undefined}
          {...register("name")}
        />
        <FieldError id={`${nameId}-error`}>{errors.name?.message}</FieldError>
      </Field>
      <Field data-invalid={Boolean(errors.description)}>
        <FieldLabel htmlFor={descriptionId}>{t("descriptionLabel")}</FieldLabel>
        <Textarea
          id={descriptionId}
          className={isCreate ? "min-h-9 py-[7px] leading-5" : undefined}
          rows={isCreate ? 1 : undefined}
          placeholder={isCreate ? t("descriptionPlaceholder") : undefined}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={
            errors.description ? `${descriptionId}-error` : undefined
          }
          {...register("description")}
        />
        <FieldError id={`${descriptionId}-error`}>
          {errors.description?.message}
        </FieldError>
      </Field>
    </>
  );
}
