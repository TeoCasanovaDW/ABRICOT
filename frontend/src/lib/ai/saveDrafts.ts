import { apiClient } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import type { Task } from "@/types";
import type { Draft } from "./validateDrafts";

// Client-safe despite sitting next to the server-only mistralClient.ts/
// validateDrafts.ts — only ever calls the same-origin Route Handler via
// apiClient, never apiServer/BACKEND_API_URL.

export type SaveDraftInput = Draft & { draftId: string; assigneeIds: string[] };

// null: the sequence ran to completion (every draft either succeeded or
// failed with its own 400). Any other value means the sequence stopped
// before reaching the remaining drafts, which are left untouched/editable —
// tasks already created before the stop are never rolled back.
export type SaveStopReason = "server_error" | "unauthorized" | "forbidden" | null;

export interface SaveDraftsResult {
  succeededIds: string[];
  failedIds: string[];
  stopReason: SaveStopReason;
}

interface SaveDraftsOptions {
  projectId: string;
  drafts: SaveDraftInput[];
  onProgress?: (current: number, total: number) => void;
}

// Sequential, not parallel — no bulk-create endpoint exists, and outcomes
// must be attributable to a stable draftId for partial-success reporting.
// A draft-specific 400 fails only that draft and the sequence continues;
// every other outcome (network failure/5xx, 401, project 403/404) stops the
// sequence, each for the caller to handle differently (retry-in-place,
// session redirect, exiting the flow).
export async function saveDrafts({ projectId, drafts, onProgress }: SaveDraftsOptions): Promise<SaveDraftsResult> {
  const succeededIds: string[] = [];
  const failedIds: string[] = [];
  let stopReason: SaveStopReason = null;

  for (let index = 0; index < drafts.length; index += 1) {
    const draft = drafts[index];
    onProgress?.(index + 1, drafts.length);

    try {
      await apiClient<{ task: Task }>(`/projects/${projectId}/tasks`, {
        method: "POST",
        body: JSON.stringify({
          title: draft.title,
          description: draft.description,
          dueDate: draft.dueDate,
          status: draft.status,
          priority: draft.priority,
          assigneeIds: draft.assigneeIds,
        }),
      });
      succeededIds.push(draft.draftId);
    } catch (error) {
      if (!isApiError(error)) throw error;

      failedIds.push(draft.draftId);

      if (error.status === 400) continue;

      if (error.status === 401) {
        stopReason = "unauthorized";
      } else if (error.status === 403 || error.status === 404) {
        stopReason = "forbidden";
      } else {
        stopReason = "server_error";
      }
      break;
    }
  }

  return { succeededIds, failedIds, stopReason };
}
