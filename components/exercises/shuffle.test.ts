import { describe, it, expect } from "vitest";
import { shuffleSeeded, seedFromData } from "./shuffle";

describe("shuffleSeeded", () => {
  const items = ["Eins", "Zwei", "Drei", "Vier", "Fünf"];

  it("ist deterministisch: gleicher Seed → gleiche Reihenfolge", () => {
    const a = shuffleSeeded(items, "uebung-1");
    const b = shuffleSeeded(items, "uebung-1");
    expect(a).toEqual(b);
  });

  it("liefert eine Permutation (gleiche Elemente, gleiche Anzahl)", () => {
    const result = shuffleSeeded(items, 42);
    expect([...result].sort()).toEqual([...items].sort());
    expect(result).toHaveLength(items.length);
  });

  it("verändert die Eingabe nicht (kein Mutieren)", () => {
    const copy = [...items];
    shuffleSeeded(items, "seed");
    expect(items).toEqual(copy);
  });

  it("ist NIE identisch mit der Lösungs-Reihenfolge, wenn vermeidbar", () => {
    // Viele Seeds durchprobieren – keiner darf die Original-Reihenfolge liefern.
    for (let seed = 0; seed < 200; seed++) {
      expect(shuffleSeeded(items, seed)).not.toEqual(items);
    }
    // Auch der Minimalfall mit 2 Elementen muss immer getauscht sein.
    for (let seed = 0; seed < 200; seed++) {
      expect(shuffleSeeded(["A", "B"], seed)).toEqual(["B", "A"]);
    }
  });

  it("verschiedene Seeds ergeben (in der Regel) verschiedene Reihenfolgen", () => {
    const orders = new Set(
      Array.from({ length: 20 }, (_, seed) =>
        JSON.stringify(shuffleSeeded(items, seed)),
      ),
    );
    expect(orders.size).toBeGreaterThan(1);
  });

  it("gibt Arrays mit 0 oder 1 Element unverändert zurück", () => {
    expect(shuffleSeeded([], "x")).toEqual([]);
    expect(shuffleSeeded(["allein"], "x")).toEqual(["allein"]);
  });

  it("gibt bei inhaltsgleichen Elementen einfach eine Kopie zurück", () => {
    expect(shuffleSeeded(["gleich", "gleich"], "x")).toEqual([
      "gleich",
      "gleich",
    ]);
  });

  it("mischt auch Objekte (Vergleich inhaltlich, nicht per Referenz)", () => {
    const steps = [{ text: "A" }, { text: "B" }, { text: "C" }];
    const result = shuffleSeeded(steps, "obj-seed");
    expect(result).not.toEqual(steps);
    expect([...result].map((s) => s.text).sort()).toEqual(["A", "B", "C"]);
  });
});

describe("seedFromData", () => {
  it("baut einen stabilen Seed aus Teilen", () => {
    expect(seedFromData(3, "Putzmaterial holen.")).toBe(
      "3|Putzmaterial holen.",
    );
  });

  it("lässt undefined-Teile weg", () => {
    expect(seedFromData("a", undefined, 2)).toBe("a|2");
  });
});
