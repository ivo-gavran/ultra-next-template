"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { signInSchema, type SignInInput } from "@/features/auth/schemas";
import { useRouter } from "@/i18n/navigation";
import { AppError, ErrorCode } from "@/lib/errors";
import { useErrorMessage } from "@/lib/errors/use-error-message";
import { useValidationErrorMap } from "@/lib/validation/use-validation-error-map";

export function SignInForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const getErrorMessage = useErrorMessage();
  const validationErrorMap = useValidationErrorMap();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema, { error: validationErrorMap }),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (input) => {
    try {
      const result = await signIn("credentials", {
        ...input,
        redirect: false,
      });

      if (result.error) {
        setError("root", {
          message: getErrorMessage(
            new AppError({ code: ErrorCode.InvalidCredentials }),
          ),
        });
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setError("root", { message: getErrorMessage(error) });
    }
  });

  return (
    <form className="space-y-5" onSubmit={onSubmit} noValidate>
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
          autoComplete="current-password"
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
        {isSubmitting ? t("signingIn") : t("signIn")}
      </Button>
    </form>
  );
}
