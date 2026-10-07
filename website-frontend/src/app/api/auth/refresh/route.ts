import { NextResponse } from "next/server";

export async function POST() {
  // Backend does not currently support refresh token (DN-4).
  // Return HTTP 401 so callers do not treat this as successful refresh.
  // Do NOT prematurely wipe session cookies here; session logout is handled via /api/auth/logout.
  return NextResponse.json(
    {
      code: "REFRESH_UNSUPPORTED",
      message: "Refresh token is currently unsupported by backend.",
    },
    { status: 401 }
  );
}
