import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { apiServer } from "@/lib/api/server";
import { isApiError } from "@/lib/api/errors";
import type { UserSummary } from "@/types";

// Thin proxy to GET /users/search.
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query") ?? "";

  try {
    const { users } = await apiServer<{ users: UserSummary[] }>(
      `/users/search?query=${encodeURIComponent(query)}`
    );

    return NextResponse.json({
      success: true,
      message: "Recherche effectuée",
      data: { users },
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
