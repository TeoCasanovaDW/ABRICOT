import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { apiServer } from "@/lib/api/server";
import { isApiError } from "@/lib/api/errors";
import { setSessionCookie } from "@/lib/session";
import type { User } from "@/types";

// Thin proxy to POST /auth/login. Strips the JWT out of the response body
// into an HttpOnly cookie before replying — the token never reaches the browser.
export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    const { user, token } = await apiServer<{ user: User; token: string }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify(body) }
    );

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      message: "Connexion réussie",
      data: { user },
    });
  } catch (error) {
    if (!isApiError(error)) throw error;

    return NextResponse.json(
      {
        success: false,
        message: error.message,
        error: error.code,
        data: error.fieldErrors ? { errors: error.fieldErrors } : undefined,
      },
      { status: error.status }
    );
  }
}
