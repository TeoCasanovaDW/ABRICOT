import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { apiServer } from "@/lib/api/server";
import { isApiError } from "@/lib/api/errors";
import type { Project } from "@/types";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

// Thin proxy to PUT /projects/:id.
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { projectId } = await params;
  const body = await request.json();

  try {
    const { project } = await apiServer<{ project: Project }>(`/projects/${projectId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });

    return NextResponse.json({
      success: true,
      message: "Projet mis à jour avec succès",
      data: { project },
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
