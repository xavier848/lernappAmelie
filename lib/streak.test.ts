import { describe, expect, it } from "vitest";
import { computeStreak } from "@/lib/streak";

describe("computeStreak", () => {
  it("gibt 0 bei leerer Liste", () => {
    expect(computeStreak([], "2026-07-09")).toBe(0);
  });

  it("gibt 1, wenn nur heute gelernt wurde", () => {
    expect(computeStreak(["2026-07-09"], "2026-07-09")).toBe(1);
  });

  it("heute noch nicht gelernt bricht den Streak nicht (gestern + vorgestern → 2)", () => {
    expect(computeStreak(["2026-07-08", "2026-07-07"], "2026-07-09")).toBe(2);
  });

  it("zaehlt heute + gestern als 2", () => {
    expect(computeStreak(["2026-07-09", "2026-07-08"], "2026-07-09")).toBe(2);
  });

  it("gibt 0, wenn zuletzt vorgestern gelernt wurde (Luecke zu heute/gestern)", () => {
    expect(computeStreak(["2026-07-07", "2026-07-06"], "2026-07-09")).toBe(0);
  });

  it("eine Luecke in der Kette beendet die Zaehlung", () => {
    // 09., 08., dann Luecke am 07., dann 06. → nur 2
    expect(
      computeStreak(["2026-07-09", "2026-07-08", "2026-07-06", "2026-07-05"], "2026-07-09")
    ).toBe(2);
  });

  it("funktioniert mit unsortierter Eingabe und Duplikaten", () => {
    expect(
      computeStreak(["2026-07-07", "2026-07-09", "2026-07-08", "2026-07-08"], "2026-07-09")
    ).toBe(3);
  });

  it("zaehlt ueber Monatsgrenzen hinweg", () => {
    expect(
      computeStreak(["2026-07-01", "2026-06-30", "2026-06-29"], "2026-07-01")
    ).toBe(3);
  });

  it("zaehlt ueber Jahresgrenzen hinweg", () => {
    expect(computeStreak(["2026-01-01", "2025-12-31"], "2026-01-01")).toBe(2);
  });

  it("ignoriert Tage in der Zukunft", () => {
    expect(computeStreak(["2026-07-10"], "2026-07-09")).toBe(0);
  });
});
