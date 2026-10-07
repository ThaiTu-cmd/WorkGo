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
    // If backend is offline or unreachable, provide resilient fallback
    const isDemoToken = Boolean(token?.startsWith("demo-"));
    const isDev = process.env.NODE_ENV !== "production";

    if (isDemoToken || isDev) {
      const isProvider = token?.includes("provider");

      if (targetPath.includes("identity/users/myInfo")) {
        return Response.json({
          code: 1000,
          message: "Success (Demo Mode)",
          result: {
            userId: isProvider ? "usr-demo-provider" : "usr-demo-client",
            firstName: isProvider ? "Nguyễn" : "Trần",
            lastName: isProvider ? "Thợ Giỏi" : "Khách Hàng",
            userName: isProvider ? "provider1" : "demouser1",
            phone: "0901234567",
            email: isProvider ? "provider1@workgo.vn" : "demouser1@workgo.vn",
            roles: isProvider ? ["PROVIDER", "USER"] : ["CLIENT", "USER"],
          },
        });
      }

      if (targetPath.includes("identity/users/") && request.method === "PUT") {
        return Response.json({
          code: 1000,
          message: "Cập nhật hồ sơ thành công (Demo)",
          result: {
            userId: isProvider ? "usr-demo-provider" : "usr-demo-client",
            firstName: "Nguyễn",
            lastName: "Người Dùng",
            userName: isProvider ? "provider1" : "demouser1",
            phone: "0901234567",
            email: isProvider ? "provider1@workgo.vn" : "demouser1@workgo.vn",
            roles: isProvider ? ["PROVIDER", "USER"] : ["CLIENT", "USER"],
          },
        });
      }

      if (targetPath.includes("identity/providers/myProfile")) {
        if (isProvider) {
          return Response.json({
            code: 1000,
            message: "Success (Demo Mode)",
            result: {
              providerProfileId: "prov-demo-1",
              providerType: "INDIVIDUAL",
              businessName: "Dịch Vụ Kỹ Thuật Chuyên Nghiệp",
              bio: "Chuyên cung cấp dịch vụ sửa chữa và thiết kế kỹ thuật chất lượng cao tại nhà.",
              verificationStatus: "VERIFIED",
              ratingAvg: 5.0,
              ratingCount: 12,
              completedOrderCount: 15,
              isAcceptingOrders: true,
              joinedAt: new Date().toISOString(),
              userId: "usr-demo-provider",
            },
          });
        }
        return Response.json(
          { code: 1004, message: "Provider profile not found" },
          { status: 404 }
        );
      }

      if (targetPath.includes("identity/addresses/my")) {
        return Response.json({
          totalPages: 1,
          pageSize: 10,
          totalElements: 1,
          currentPage: 0,
          data: [
            {
              addressId: "addr-demo-1",
              label: "Nhà riêng",
              contactName: "Khách Hàng Demo",
              contactPhone: "0901234567",
              line1: "123 Nguyễn Huệ, Phường Bến Nghé",
              ward: "Phường Bến Nghé",
              district: "Quận 1",
              city: "TP. Hồ Chí Minh",
              countryCode: "VN",
              isDefault: true,
            },
          ],
        });
      }

      if (targetPath.includes("catalog/categories/roots")) {
        return Response.json({
          code: 1000,
          message: "Success (Catalog Demo)",
          result: [
            { categoryId: "cat-1", categoryName: "Thiết kế & Đồ họa", description: "UI/UX, Logo, Banner" },
            { categoryId: "cat-2", categoryName: "Lập trình & Công nghệ", description: "Web, Mobile, Backend" },
            { categoryId: "cat-3", categoryName: "Viết lách & Dịch thuật", description: "Content, Copywriting, Biên dịch" },
            { categoryId: "cat-4", categoryName: "Marketing & Truyền thông", description: "SEO, Ads, Social Media" },
            { categoryId: "cat-5", categoryName: "Sửa chữa & Kỹ thuật tại nhà", description: "Điện nước, Điện lạnh" },
            { categoryId: "cat-6", categoryName: "Vệ sinh & Gia đình", description: "Dọn dẹp nhà cửa, Giặt ủi" },
          ],
        });
      }
    }

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
