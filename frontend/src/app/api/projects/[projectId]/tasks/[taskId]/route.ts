import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { apiServer } from "@/lib/api/server";
import { isApiError } from "@/lib/api/errors";
import type { Task } from "@/types";

interface RouteParams {
  params: Promise<{ projectId: string; taskId: string }>;
}

// Thin proxy to PUT /projects/:id/tasks/:taskId.
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { projectId, taskId } = await params;
  const body = await request.json();

  try {
    const { task } = await apiServer<{ task: Task }>(`/projects/${projectId}/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });

    return NextResponse.json({
      success: true,
      message: "Tâche mise à jour avec succès",
      data: { task },
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
