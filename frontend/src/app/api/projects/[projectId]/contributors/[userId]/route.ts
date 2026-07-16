import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { apiServer } from "@/lib/api/server";
import { isApiError } from "@/lib/api/errors";

interface RouteParams {
  params: Promise<{ projectId: string; userId: string }>;
}

// Thin proxy to DELETE /projects/:id/contributors/:userId. Backend returns
// no `data` on success (specs/01) — the caller refetches the project.
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { projectId, userId } = await params;

  try {
    await apiServer(`/projects/${projectId}/contributors/${userId}`, {
      method: "DELETE",
    });

    return NextResponse.json({
      success: true,
      message: "Contributeur retiré avec succès",
    });
  } catch (error) {
    if (!isApiError(error)) throw error;

    return NextResponse.json(
      {
        success: false,
        message: error.message,
        error: error.code,
      },
      { status: error.status }
    );
  }
}
