import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { apiServer } from "@/lib/api/server";
import { isApiError } from "@/lib/api/errors";
import type { Comment } from "@/types";

interface RouteParams {
  params: Promise<{ projectId: string; taskId: string }>;
}

// Thin proxy to POST /projects/:id/tasks/:taskId/comments.
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { projectId, taskId } = await params;
  const body = await request.json();

  try {
    const { comment } = await apiServer<{ comment: Comment }>(
      `/projects/${projectId}/tasks/${taskId}/comments`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );

    return NextResponse.json({
      success: true,
      message: "Commentaire créé avec succès",
      data: { comment },
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
