import { describe, expect, it } from "vitest";
import {
  LESSON_BONUS_XP,
  levelForXp,
  starsForLesson,
  stepsOrderPartial,
  xpForExercise,
} from "@/lib/scoring";

describe("stepsOrderPartial", () => {
  it("erkennt die exakt richtige Reihenfolge als perfekt", () => {
    const correct = ["a", "b", "c", "d"];
    const result = stepsOrderPartial(correct, ["a", "b", "c", "d"]);
    expect(result).toEqual({ correctPairs: 3, totalPairs: 3, perfect: true });
  });

  it("zaehlt Teilpunkte fuer korrekt aufeinanderfolgende Paare", () => {
    // "b,c" ist das einzige korrekte Nachbar-Paar in der Abgabe
    const correct = ["a", "b", "c", "d"];
    const result = stepsOrderPartial(correct, ["b", "c", "a", "d"]);
    expect(result.totalPairs).toBe(3);
    expect(result.correctPairs).toBe(1);
    expect(result.perfect).toBe(false);
  });

  it("gibt 0 Paare bei komplett falscher Reihenfolge", () => {
    const correct = ["a", "b", "c"];
    const result = stepsOrderPartial(correct, ["c", "a", "b"]);
    // Nachbar-Paare der Abgabe: c-a, a-b → a-b ist korrekt
    expect(result.correctPairs).toBe(1);
    // Komplett rueckwaerts hat kein korrektes Paar
    expect(stepsOrderPartial(correct, ["c", "b", "a"]).correctPairs).toBe(0);
  });

  it("behandelt eine leere Abgabe als 0 Punkte und nicht perfekt", () => {
    const result = stepsOrderPartial(["a", "b", "c"], []);
    expect(result).toEqual({ correctPairs: 0, totalPairs: 2, perfect: false });
  });

  it("ist bei nur einem Schritt perfekt, wenn er stimmt", () => {
    expect(stepsOrderPartial(["a"], ["a"])).toEqual({
      correctPairs: 0,
      totalPairs: 0,
      perfect: true,
    });
  });
});

describe("xpForExercise", () => {
  it("gibt 10 XP beim ersten Versuch", () => {
    expect(xpForExercise(true)).toBe(10);
  });

  it("gibt 5 XP nach Wiederholung", () => {
    expect(xpForExercise(false)).toBe(5);
  });

  it("Lektions-Bonus ist 20 XP", () => {
    expect(LESSON_BONUS_XP).toBe(20);
  });
});

describe("starsForLesson", () => {
  it("gibt 3 Sterne ohne Wiederholungen", () => {
    expect(starsForLesson(8, 0)).toBe(3);
  });

  it("gibt 2 Sterne bei 1 oder 2 Wiederholungen", () => {
    expect(starsForLesson(8, 1)).toBe(2);
    expect(starsForLesson(8, 2)).toBe(2);
  });

  it("gibt 1 Stern bei mehr als 2 Wiederholungen", () => {
    expect(starsForLesson(8, 3)).toBe(1);
    expect(starsForLesson(8, 8)).toBe(1);
  });
});

describe("levelForXp", () => {
  it("startet bei Level 1 mit 0 XP", () => {
    expect(levelForXp(0)).toEqual({ level: 1, currentXp: 0, nextLevelXp: 100 });
  });

  it("bleibt kurz vor der Schwelle in Level 1", () => {
    expect(levelForXp(99)).toEqual({ level: 1, currentXp: 99, nextLevelXp: 100 });
  });

  it("erreicht Level 2 bei genau 100 XP (Schwelle Level 1→2 = 1*100)", () => {
    expect(levelForXp(100)).toEqual({ level: 2, currentXp: 0, nextLevelXp: 200 });
  });

  it("zaehlt XP innerhalb des Levels", () => {
    expect(levelForXp(150)).toEqual({ level: 2, currentXp: 50, nextLevelXp: 200 });
  });

  it("erreicht Level 3 bei kumulativ 300 XP (100 + 200)", () => {
    expect(levelForXp(299)).toEqual({ level: 2, currentXp: 199, nextLevelXp: 200 });
    expect(levelForXp(300)).toEqual({ level: 3, currentXp: 0, nextLevelXp: 300 });
  });

  it("erreicht Level 4 bei kumulativ 600 XP (100 + 200 + 300)", () => {
    expect(levelForXp(600)).toEqual({ level: 4, currentXp: 0, nextLevelXp: 400 });
  });
});
