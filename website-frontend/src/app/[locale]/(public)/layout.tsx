import { getSession } from "@/lib/session";
import { PublicHeader } from "@/components/shell/public-header";
import { AppShellClient } from "@/components/shell/app-shell-client";

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();

  if (session.isAuthenticated) {
    const role = session.role || "CLIENT";
    return (
      <AppShellClient
        locale={locale}
        role={role}
        userName={role === "PROVIDER" ? "provider" : "member"}
        fullName={role === "PROVIDER" ? "Đối tác WorkGo" : "Khách hàng"}
      >
        {children}
      </AppShellClient>
    );
  }

  return (
    <div className="min-h-screen bg-app flex flex-col">
      <PublicHeader locale={locale} />
      <main className="flex-1 pb-20 md:pb-8">{children}</main>
    </div>
  );
}
