import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("kombiniert Klassen", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("filtert falsy Werte", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
});
