import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { apiServer } from "@/lib/api/server";
import { isApiError } from "@/lib/api/errors";

// Thin proxy to PUT /auth/password. Backend returns no `data` on success
// (specs/01) — the 200 itself is the confirmation, nothing to forward.
export async function PUT(request: NextRequest) {
  const body = await request.json();

  try {
    await apiServer("/auth/password", {
      method: "PUT",
      body: JSON.stringify(body),
    });

    return NextResponse.json({
      success: true,
      message: "Mot de passe mis à jour avec succès",
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
