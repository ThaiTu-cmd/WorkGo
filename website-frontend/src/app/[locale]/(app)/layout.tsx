import { getSession } from "@/lib/session";
import { AppShellClient } from "@/components/shell/app-shell-client";

export default async function AppShellLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  const role = session.role || "CLIENT";

  return (
    <AppShellClient
      locale={locale}
      role={role}
      userName={session.isAuthenticated ? (session.role === "PROVIDER" ? "provider" : "member") : "guest"}
      fullName={session.role === "PROVIDER" ? "Đối tác WorkGo" : "Khách hàng"}
    >
      {children}
    </AppShellClient>
  );
}
