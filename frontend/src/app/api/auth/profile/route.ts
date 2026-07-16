import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { apiServer } from "@/lib/api/server";
import { isApiError } from "@/lib/api/errors";
import type { User } from "@/types";

// Thin proxy to PUT /auth/profile. No cookie changes — updating name/email
// never rotates the JWT (specs/05), so the session stays valid as-is.
export async function PUT(request: NextRequest) {
  const body = await request.json();

  try {
    const { user } = await apiServer<{ user: User }>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(body),
    });

    return NextResponse.json({
      success: true,
      message: "Profil mis à jour avec succès",
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
