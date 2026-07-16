import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { apiServer } from "@/lib/api/server";
import { isApiError } from "@/lib/api/errors";
import type { Project } from "@/types";

// Thin proxy to POST /projects.
export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    const { project } = await apiServer<{ project: Project }>("/projects", {
      method: "POST",
      body: JSON.stringify(body),
    });

    return NextResponse.json({
      success: true,
      message: "Projet créé avec succès",
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
