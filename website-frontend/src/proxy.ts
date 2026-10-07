import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { COOKIE_ACCESS_TOKEN, COOKIE_USER_ROLE } from "./lib/session";

const handleI18nRouting = createMiddleware(routing);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Exclude API and static files
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const hasLocale = segments[0] && routing.locales.includes(segments[0] as "vi" | "en");
  const locale = hasLocale ? segments[0] : "vi";
  const pathWithoutLocale = hasLocale
    ? "/" + segments.slice(1).join("/")
    : pathname;

  const token = request.cookies.get(COOKIE_ACCESS_TOKEN)?.value;
  const role = request.cookies.get(COOKIE_USER_ROLE)?.value || "CLIENT";

  const isGuestOnly =
    pathWithoutLocale === "/login" || pathWithoutLocale === "/register";

  const isAuthRequired =
    pathWithoutLocale.startsWith("/settings") ||
    pathWithoutLocale.startsWith("/wallet") ||
    pathWithoutLocale.startsWith("/reviews") ||
    pathWithoutLocale.startsWith("/disputes") ||
    pathWithoutLocale.startsWith("/client") ||
    pathWithoutLocale.startsWith("/provider");

  // Guest-only guard
  if (isGuestOnly && token) {
    const target = role === "PROVIDER" ? `/${locale}/provider` : `/${locale}/client`;
    return NextResponse.redirect(new URL(target, request.url));
  }

  // Auth guard
  if (isAuthRequired && !token) {
    const nextUrl = new URL(`/${locale}/login`, request.url);
    nextUrl.searchParams.set("next", `/${locale}${pathWithoutLocale}`);
    return NextResponse.redirect(nextUrl);
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher: [
    "/",
    "/(vi|en)/:path*",
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
