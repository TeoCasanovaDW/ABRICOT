import { describe, expect, it } from "vitest";
import { MAX_DRAFTS, validateDrafts } from "./validateDrafts";

function draft(overrides: Record<string, unknown> = {}) {
  return {
    title: "Préparer la démo",
    description: "Rassembler les slides",
    dueDate: "2026-09-01",
    ...overrides,
  };
}

describe("validateDrafts", () => {
  it("drops invalid items, defaults status/priority, and caps the list at MAX_DRAFTS", () => {
    const items = [...Array.from({ length: MAX_DRAFTS + 5 }, () => draft()), draft({ title: "x" })]; // last title fails min length
    const result = validateDrafts(JSON.stringify(items));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.drafts).toHaveLength(MAX_DRAFTS);
      expect(result.drafts[0]).toMatchObject({ status: "TODO", priority: "MEDIUM" });
    }
  });

  it("fails when every item is invalid", () => {
    const result = validateDrafts(JSON.stringify([{ title: "x" }]));

    expect(result).toEqual({ ok: false, reason: "zero_valid_items" });
  });
});
