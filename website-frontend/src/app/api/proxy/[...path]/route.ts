import { cookies } from "next/headers";
import { API_BASE_URL } from "@/lib/env";
import { COOKIE_ACCESS_TOKEN } from "@/lib/session";

export const dynamic = "force-dynamic";

const CATALOG_BASE_URL = process.env.CATALOG_BASE_URL || "http://localhost:8082";

export async function handleProxy(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  if (!path || path.length === 0) {
    return Response.json(
      { code: "BAD_REQUEST", message: "Missing proxy path" },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value;

  const url = new URL(request.url);
  const targetPath = path.join("/");

  let targetUrl: string;
  if (targetPath.startsWith("catalog/")) {
    targetUrl = `${CATALOG_BASE_URL}/${targetPath}${url.search}`;
  } else if (targetPath.startsWith("api/")) {
    targetUrl = `${API_BASE_URL}/${targetPath}${url.search}`;
  } else {
    targetUrl = `${API_BASE_URL}/api/${targetPath}${url.search}`;
  }

  const forwardHeaders = new Headers(request.headers);
  forwardHeaders.delete("host");
  forwardHeaders.delete("cookie");

  // Automatically attach Bearer token from httpOnly cookie if not already set
  if (token && !forwardHeaders.has("authorization")) {
    forwardHeaders.set("authorization", `Bearer ${token}`);
  }

  try {
    const hasBody = !["GET", "HEAD"].includes(request.method);
    const body = hasBody ? await request.blob() : undefined;

    const res = await fetch(targetUrl, {
      method: request.method,
      headers: forwardHeaders,
      body,
      cache: "no-store",
    });

    const data = await res.arrayBuffer();
    return new Response(data, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") || "application/json",
      },
    });
  } catch {
    return Response.json(
      { code: "BACKEND_OFFLINE", message: "Không thể kết nối đến dịch vụ Backend." },
      { status: 503 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
export const PATCH = handleProxy;
export const HEAD = handleProxy;
export const OPTIONS = handleProxy;
