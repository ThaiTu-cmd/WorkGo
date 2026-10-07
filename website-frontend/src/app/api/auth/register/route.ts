import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/env";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, userName, password, phone, email } = body;

    const res = await fetch(`${API_BASE_URL}/api/v1/identity/users/registration`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        userName,
        password,
        phone,
        email,
      }),
    });

    const data = await res.json();

    if (!res.ok || data.code !== 1000) {
      return NextResponse.json(
        {
          code: data.code || 1001,
          message: data.message || "Đăng ký không thành công.",
        },
        { status: res.status || 400 }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { code: "NETWORK", message: "Không thể kết nối máy chủ." },
      { status: 500 }
    );
  }
}
