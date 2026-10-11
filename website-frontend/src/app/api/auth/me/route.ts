import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_BASE_URL } from "@/lib/env";
import { COOKIE_ACCESS_TOKEN } from "@/lib/session";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value;

  if (!token) {
    return NextResponse.json(
      { code: 1006, message: "Chưa đăng nhập." },
      { status: 401 }
    );
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/identity/users/myInfo`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { code: "NETWORK", message: "Không thể kết nối máy chủ." },
      { status: 500 }
    );
  }
}
