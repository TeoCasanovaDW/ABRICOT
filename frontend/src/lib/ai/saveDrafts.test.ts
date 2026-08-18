import { afterEach, describe, expect, it, vi } from "vitest";
import { saveDrafts, type SaveDraftInput } from "./saveDrafts";

// apiClient() calls the global fetch and branches on `instanceof Response`,
// so mocks must return real Response instances, not plain objects.
function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function makeDraft(overrides: Partial<SaveDraftInput> = {}): SaveDraftInput {
  return {
    draftId: "draft-1",
    title: "Écrire les tests",
    description: "Couvrir saveDrafts",
    dueDate: "2026-09-01",
    status: "TODO",
    priority: "MEDIUM",
    assigneeIds: [],
    ...overrides,
  };
}

describe("saveDrafts", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("succeeds for every draft and reports no stop reason", async () => {
    // A Response body can only be read once, so each call needs a fresh instance.
    const fetchMock = vi.fn().mockImplementation(async () =>
      jsonResponse(200, { success: true, message: "ok", data: { task: {} } })
    );
    vi.stubGlobal("fetch", fetchMock);

    const drafts = [makeDraft({ draftId: "a" }), makeDraft({ draftId: "b" })];
    const result = await saveDrafts({ projectId: "p1", drafts });

    expect(result).toEqual({ succeededIds: ["a", "b"], failedIds: [], stopReason: null });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("skips a draft-specific 400 and continues with the rest", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(400, { success: false, message: "Titre invalide" }))
      .mockResolvedValueOnce(jsonResponse(200, { success: true, message: "ok", data: { task: {} } }));
    vi.stubGlobal("fetch", fetchMock);

    const drafts = [makeDraft({ draftId: "a" }), makeDraft({ draftId: "b" })];
    const result = await saveDrafts({ projectId: "p1", drafts });

    expect(result).toEqual({ succeededIds: ["b"], failedIds: ["a"], stopReason: null });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("stops the sequence on a server error and leaves remaining drafts untouched", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { success: true, message: "ok", data: { task: {} } }))
      .mockResolvedValueOnce(jsonResponse(500, { success: false, message: "Erreur serveur" }));
    vi.stubGlobal("fetch", fetchMock);

    const drafts = [makeDraft({ draftId: "a" }), makeDraft({ draftId: "b" }), makeDraft({ draftId: "c" })];
    const result = await saveDrafts({ projectId: "p1", drafts });

    expect(result).toEqual({ succeededIds: ["a"], failedIds: ["b"], stopReason: "server_error" });
    // The third draft is never attempted once the sequence stops.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
