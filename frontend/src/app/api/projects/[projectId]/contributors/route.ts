import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { apiServer } from "@/lib/api/server";
import { isApiError } from "@/lib/api/errors";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

// Thin proxy to POST /projects/:id/contributors. Backend returns no `data`
// on success (specs/01) — the caller refetches the project to see the member.
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { projectId } = await params;
  const body = await request.json();

  try {
    await apiServer(`/projects/${projectId}/contributors`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    return NextResponse.json({
      success: true,
      message: "Contributeur ajouté avec succès",
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
