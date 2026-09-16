"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { registerAccount } from "@/features/auth/api";
import { signUpSchema, type SignUpInput } from "@/features/auth/schemas";
import { useRouter } from "@/i18n/navigation";
import { useErrorMessage } from "@/lib/errors/use-error-message";
import { useValidationErrorMap } from "@/lib/validation/use-validation-error-map";

export function SignUpForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const getErrorMessage = useErrorMessage();
  const validationErrorMap = useValidationErrorMap();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema, { error: validationErrorMap }),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (input) => {
    try {
      await registerAccount(input);
      const result = await signIn("credentials", {
        email: input.email,
        password: input.password,
        redirect: false,
      });

      if (result.error) {
        router.replace("/sign-in");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setError("root", {
        message: getErrorMessage(error),
      });
    }
  });

  return (
    <form className="space-y-5" onSubmit={onSubmit} noValidate>
      <div className="space-y-2">
        <Label htmlFor="name">{t("name")}</Label>
        <Input
          id="name"
          autoComplete="name"
          placeholder={t("namePlaceholder")}
          aria-invalid={Boolean(errors.name)}
          {...register("name")}
        />
        {errors.name && (
          <p className="text-destructive text-sm">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-destructive text-sm">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder={t("passwordHint")}
          aria-invalid={Boolean(errors.password)}
          {...register("password")}
        />
        {errors.password && (
          <p className="text-destructive text-sm">{errors.password.message}</p>
        )}
      </div>

      {errors.root && (
        <p
          role="alert"
          className="bg-destructive/10 text-destructive rounded-xl p-3 text-sm"
        >
          {errors.root.message}
        </p>
      )}

      <Button className="w-full" type="submit" disabled={isSubmitting}>
        {isSubmitting && <Spinner />}
        {isSubmitting ? t("creating") : t("signUp")}
      </Button>
    </form>
  );
}
