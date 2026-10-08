import { redirect } from "next/navigation";

export default async function ProviderSettingsAliasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/settings?tab=provider`);
}
