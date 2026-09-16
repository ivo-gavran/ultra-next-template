import { redirect } from "next/navigation";

import { auth } from "@/auth";

export default async function ProtectedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const [{ locale }, session] = await Promise.all([params, auth()]);

  if (!session?.user) {
    redirect(`/${locale}/sign-in`);
  }

  return children;
}
