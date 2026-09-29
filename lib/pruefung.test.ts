import { describe, expect, it } from "vitest";
import {
  baueVersuchsStatistik,
  istPruefungsThema,
  istSicher,
  testPrioritaet,
  trennePruefungsThemen,
  waehleTestUebungen,
  type TestUebung,
} from "./pruefung";

/** Einfacher deterministischer Zufall fuer reproduzierbare Tests. */
function seeded(seed = 1): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function uebung(id: string, lessonId: string): TestUebung {
  return { id, lessonId, type: "multiple_choice", data: {} };
}

describe("istPruefungsThema", () => {
  it("erkennt Pruefungs-Themen am Praefix", () => {
    expect(istPruefungsThema("pruefung-unfall-arbeitsplatz-hygiene")).toBe(true);
    expect(istPruefungsThema("arbeitssicherheit")).toBe(false);
    expect(istPruefungsThema(null)).toBe(false);
    expect(istPruefungsThema(undefined)).toBe(false);
  });
});

describe("trennePruefungsThemen", () => {
  it("trennt ohne die Reihenfolge zu aendern", () => {
    const { normal, pruefung } = trennePruefungsThemen([
      { slug: "badezimmer" },
      { slug: "pruefung-a" },
      { slug: "kueche" },
      { slug: "pruefung-b" },
    ]);
    expect(normal.map((t) => t.slug)).toEqual(["badezimmer", "kueche"]);
    expect(pruefung.map((t) => t.slug)).toEqual(["pruefung-a", "pruefung-b"]);
  });
});

describe("baueVersuchsStatistik", () => {
  it("zaehlt Versuche und merkt sich die NEUESTE Antwort (erste Zeile)", () => {
    const stats = baueVersuchsStatistik([
      { exercise_id: "x", correct: true },
      { exercise_id: "x", correct: false },
      { exercise_id: "y", correct: false },
    ]);
    expect(stats.get("x")).toEqual({ correct: 1, wrong: 1, lastCorrect: true });
    expect(stats.get("y")).toEqual({ correct: 0, wrong: 1, lastCorrect: false });
  });
});

describe("istSicher", () => {
  it("sicher = letzte Antwort richtig", () => {
    const stats = baueVersuchsStatistik([
      { exercise_id: "a", correct: true },
      { exercise_id: "a", correct: false },
      { exercise_id: "b", correct: false },
      { exercise_id: "b", correct: true },
    ]);
    expect(istSicher(stats, "a")).toBe(true);
    expect(istSicher(stats, "b")).toBe(false);
    expect(istSicher(stats, "nie")).toBe(false);
  });
});

describe("testPrioritaet", () => {
  it("noch nie beantwortet vor zuletzt falsch vor frueher falsch vor immer richtig", () => {
    const stats = baueVersuchsStatistik([
      { exercise_id: "zuletztFalsch", correct: false },
      { exercise_id: "zuletztFalsch", correct: true },
      { exercise_id: "frueherFalsch", correct: true },
      { exercise_id: "frueherFalsch", correct: false },
      { exercise_id: "richtig", correct: true },
    ]);
    const neu = testPrioritaet(stats, "neu");
    const zuletztFalsch = testPrioritaet(stats, "zuletztFalsch");
    const frueherFalsch = testPrioritaet(stats, "frueherFalsch");
    const richtig = testPrioritaet(stats, "richtig");
    expect(neu).toBeGreaterThan(zuletztFalsch);
    expect(zuletztFalsch).toBeGreaterThan(frueherFalsch);
    expect(frueherFalsch).toBeGreaterThan(richtig);
    expect(richtig).toBe(0);
  });
});

describe("waehleTestUebungen", () => {
  const alle = [
    uebung("a1", "A"),
    uebung("a2", "A"),
    uebung("a3", "A"),
    uebung("b1", "B"),
    uebung("b2", "B"),
    uebung("c1", "C"),
  ];

  it("liefert hoechstens so viele Uebungen wie gewuenscht, ohne Doppelte", () => {
    const test = waehleTestUebungen(alle, new Map(), 4, seeded(3));
    expect(test).toHaveLength(4);
    expect(new Set(test.map((u) => u.id)).size).toBe(4);
  });

  it("verteilt ueber alle Lektionen, bevor eine Lektion doppelt drankommt", () => {
    const test = waehleTestUebungen(alle, new Map(), 3, seeded(7));
    expect(new Set(test.map((u) => u.lessonId))).toEqual(new Set(["A", "B", "C"]));
  });

  it("nimmt innerhalb einer Lektion zuerst Ungeuebtes und Falsches", () => {
    const stats = new Map([
      ["a1", { correct: 4, wrong: 0 }],
      ["a2", { correct: 2, wrong: 0 }],
      ["b1", { correct: 5, wrong: 0 }],
    ]);
    const test = waehleTestUebungen(alle, stats, 3, seeded(11));
    const ids = test.map((u) => u.id);
    expect(ids).toContain("a3");
    expect(ids).toContain("b2");
    expect(ids).toContain("c1");
  });

  it("gibt alles zurueck, wenn weniger Uebungen da sind als gewuenscht", () => {
    expect(waehleTestUebungen(alle, new Map(), 50, seeded(5))).toHaveLength(6);
    expect(waehleTestUebungen([], new Map(), 5, seeded(5))).toEqual([]);
  });
});
