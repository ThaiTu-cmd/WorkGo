import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/env";
import { COOKIE_ACCESS_TOKEN, COOKIE_USER_ROLE } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userName, password } = body;

    if (!userName || !password) {
      return NextResponse.json(
        { code: 1001, message: "Tên đăng nhập và mật khẩu là bắt buộc." },
        { status: 400 }
      );
    }

    // Attempt real backend authentication first
    let backendSuccess = false;
    let token = "";
    let role = "CLIENT";

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/identity/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, password }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.code === 1000 && data.result?.authenticated && data.result?.token) {
          backendSuccess = true;
          token = data.result.token;

          // Check user info and provider profile to determine role
          try {
            const myInfoRes = await fetch(`${API_BASE_URL}/api/v1/identity/users/myInfo`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (myInfoRes.ok) {
              const myInfo = await myInfoRes.json();
              const roles = myInfo.result?.roles || [];
              if (roles.includes("PROVIDER") || roles.includes("ROLE_PROVIDER")) {
                role = "PROVIDER";
              }
            }
          } catch {
            // Default to CLIENT
          }
        }
      }
    } catch {
      // Backend offline or unreachable
    }

    // Backend must authenticate successfully; no demo fallback.
    if (!backendSuccess) {
      return NextResponse.json(
        {
          code: 1006,
          message: "Sai email hoặc mật khẩu hoặc máy chủ backend chưa sẵn sàng.",
        },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      code: 1000,
      message: "Đăng nhập thành công",
      result: { role },
    });

    // Set httpOnly cookie for access token
    response.cookies.set({
      name: COOKIE_ACCESS_TOKEN,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    // Set readable role cookie for client navigation
    response.cookies.set({
      name: COOKIE_USER_ROLE,
      value: role,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch {
    return NextResponse.json(
      { code: "NETWORK", message: "Không thể kết nối máy chủ." },
      { status: 500 }
    );
  }
}
