import { describe, expect, it } from "vitest";
import { registerSchema } from "./validation";

describe("registerSchema", () => {
  it("rejects a password missing the required character classes", () => {
    const result = registerSchema.safeParse({
      name: "Alice",
      email: "alice@example.com",
      password: "weakpassword",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["password"]);
    }
  });

  it("accepts a valid submission and trims the name", () => {
    const result = registerSchema.safeParse({
      name: "  Alice  ",
      email: "alice@example.com",
      password: "Str0ng!Pass",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Alice");
    }
  });
});
