import { getTranslations, setRequestLocale } from "next-intl/server";

import { SignUpForm } from "@/components/auth/sign-up-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getRouteLocale } from "@/i18n/params";

export default async function SignUpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await getRouteLocale(params);
  setRequestLocale(locale);
  const t = await getTranslations("Auth");

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-5 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">{t("signUpTitle")}</CardTitle>
          <CardDescription>{t("signUpDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <SignUpForm />
          <p className="text-muted-foreground text-center text-sm">
            {t("hasAccount")}{" "}
            <Link
              className="text-primary font-medium hover:underline"
              href="/sign-in"
            >
              {t("signIn")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
