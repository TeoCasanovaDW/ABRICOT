import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { apiServer } from "@/lib/api/server";
import { isApiError } from "@/lib/api/errors";
import { getSessionToken } from "@/lib/session";
import { callMistral, MistralAdapterError, type MistralMessage } from "@/lib/ai/mistralClient";
import { validateDrafts, MAX_DRAFTS } from "@/lib/ai/validateDrafts";
import type { ProjectDetail } from "@/types";

const SYSTEM_PROMPT = [
  "You generate draft tasks for a project management tool from a free-text request.",
  "Respond with ONLY a valid JSON array — no prose, no markdown code fences, no surrounding text.",
  "Every array item MUST include all of these fields, matching the manual task-creation form's own required " +
    "fields — an item missing any of them is discarded entirely: " +
    "title (required, 2-200 characters), description (required, 1-1000 characters, a short explanation of the task), " +
    "dueDate (required, ISO 8601 date string — if the request doesn't imply a specific date, pick a reasonable " +
    "date in the near future relative to today rather than omitting it).",
  "status (optional, one of TODO, IN_PROGRESS, DONE) and priority (optional, one of LOW, MEDIUM, HIGH, URGENT) " +
    "may be omitted; a sensible default is applied when omitted.",
  "Never include an assignee field of any kind — this schema has none.",
  `Return at most ${MAX_DRAFTS} items.`,
].join(" ");

const CORRECTIVE_INSTRUCTION =
  "Your previous response was not a valid JSON array matching the schema, or every item was missing a " +
  "required field (title, description, or dueDate). Respond again with ONLY a valid JSON array of task " +
  "objects, every item carrying all required fields, no prose, no markdown.";

function buildUserPrompt(project: Pick<ProjectDetail, "name" | "description">, prompt: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return [
    `Today's date: ${today}`,
    `Project name: ${project.name}`,
    project.description ? `Project description: ${project.description}` : null,
    `Request: ${prompt}`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

// Only name/description ever reach the provider beyond the user's own
// prompt — never task data, member lists, or credentials.
function buildMessages(project: Pick<ProjectDetail, "name" | "description">, prompt: string): MistralMessage[] {
  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: buildUserPrompt(project, prompt) },
  ];
}

// Maps provider-side failures to generic client-facing categories — raw
// provider text/status never reaches the client.
function mapAdapterError(error: unknown): NextResponse {
  if (error instanceof MistralAdapterError) {
    switch (error.reason) {
      case "timeout":
        return NextResponse.json(
          { success: false, message: "La génération a expiré, réessayez.", error: "AI_TIMEOUT" },
          { status: 504 }
        );
      case "rate_limit":
        return NextResponse.json(
          { success: false, message: "Le service IA est occupé, réessayez plus tard.", error: "AI_RATE_LIMITED" },
          { status: 429 }
        );
      case "network":
      case "http":
        return NextResponse.json(
          { success: false, message: "Le service IA est indisponible.", error: "AI_UNAVAILABLE" },
          { status: 502 }
        );
    }
  }

  throw error;
}

// Reads the session cookie itself and checks project access via the same
// GET /projects/:id call that supplies name/description for the prompt —
// its 403/404 is passed straight through as the access check, never
// reimplemented here. Both checks complete before any provider call.
export async function POST(request: NextRequest) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json(
      { success: false, message: "Utilisateur non authentifié", error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  let body: { projectId?: string; prompt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Requête invalide.", error: "INVALID_REQUEST" },
      { status: 400 }
    );
  }

  const { projectId, prompt } = body;
  if (!projectId || typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json(
      { success: false, message: "Requête invalide.", error: "INVALID_REQUEST" },
      { status: 400 }
    );
  }

  let project: ProjectDetail;
  try {
    ({ project } = await apiServer<{ project: ProjectDetail }>(`/projects/${projectId}`));
  } catch (error) {
    if (!isApiError(error)) throw error;

    return NextResponse.json(
      { success: false, message: error.message, error: error.code },
      { status: error.status }
    );
  }

  const messages = buildMessages(project, prompt);

  let raw: string;
  try {
    raw = await callMistral({ messages, signal: request.signal });
  } catch (error) {
    return mapAdapterError(error);
  }

  let result = validateDrafts(raw);

  if (!result.ok) {
    try {
      raw = await callMistral({
        messages: [...messages, { role: "user", content: CORRECTIVE_INSTRUCTION }],
        signal: request.signal,
      });
    } catch (error) {
      return mapAdapterError(error);
    }

    result = validateDrafts(raw);
  }

  if (!result.ok) {
    return NextResponse.json(
      {
        success: false,
        message: "Impossible de générer les tâches, essayez de reformuler votre demande.",
        error: "AI_INVALID_RESPONSE",
      },
      { status: 422 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Tâches générées avec succès",
    data: { drafts: result.drafts },
  });
}
