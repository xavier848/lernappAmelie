import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { lessonSchema } from "@/lib/content-schema";

describe("present perfect lesson", () => {
  it("passt zum Schema", () => {
    const raw = readFileSync(
      "content/lessons/englisch/englisch-present-perfect.json",
      "utf8",
    );
    const parsed = lessonSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) console.log(JSON.stringify(parsed.error.issues, null, 2));
    expect(parsed.success).toBe(true);
  });
});
