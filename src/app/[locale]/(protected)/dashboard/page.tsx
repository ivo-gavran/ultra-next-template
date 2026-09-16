import { getTranslations, setRequestLocale } from "next-intl/server";

import { auth } from "@/auth";
import { ProjectManager } from "@/components/dashboard/project-manager";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [session, t] = await Promise.all([
    auth(),
    getTranslations("Dashboard"),
  ]);

  if (!session?.user) return null;

  const displayName = session.user.name ?? session.user.email ?? "user";

  return (
    <section className="mx-auto max-w-5xl px-5 py-16">
      <p className="text-primary text-sm font-semibold tracking-[0.18em] uppercase">
        {t("eyebrow")}
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
        {t("title", { name: displayName })}
      </h1>
      <p className="text-muted-foreground mt-4 mb-10 max-w-2xl text-lg leading-8">
        {t("description")}
      </p>
      <ProjectManager />
    </section>
  );
}
