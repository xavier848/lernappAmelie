// Tests fuer die Auswahl-Logik des Ueben-Modus (lib/practice.ts).
// Reine Funktion, rand wird injiziert -> deterministisch testbar.
import { describe, expect, it } from "vitest";
import {
  selectPracticeExercises,
  type PracticeExercise,
} from "@/lib/practice";

/** Deterministischer Pseudo-Zufall (LCG) fuer reproduzierbare Tests. */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/** Baut eine Test-Uebung. */
function ex(id: string, lessonId: string): PracticeExercise {
  return { id, lessonId, type: "multiple_choice", data: { prompt: id } };
}

/** n Uebungen "l<lesson>-e<i>" fuer eine Lektion. */
function lessonExercises(lessonId: string, n: number): PracticeExercise[] {
  return Array.from({ length: n }, (_, i) => ex(`${lessonId}-e${i}`, lessonId));
}

const noStats = new Map<string, { correct: number; wrong: number }>();

describe("selectPracticeExercises", () => {
  it("keine abgeschlossenen Lektionen -> leeres Array", () => {
    const result = selectPracticeExercises({
      exercises: lessonExercises("l1", 5),
      completedLessonIds: [],
      attemptStats: noStats,
      rand: lcg(1),
    });
    expect(result).toEqual([]);
  });

  it("nimmt nur Uebungen aus abgeschlossenen Lektionen", () => {
    const result = selectPracticeExercises({
      exercises: [...lessonExercises("l1", 4), ...lessonExercises("l2", 4)],
      completedLessonIds: ["l1"],
      attemptStats: noStats,
      rand: lcg(2),
    });
    expect(result.length).toBe(4);
    for (const item of result) expect(item.lessonId).toBe("l1");
  });

  it("weniger als count verfuegbar -> alle zurueck (als Permutation)", () => {
    const pool = lessonExercises("l1", 5);
    const result = selectPracticeExercises({
      exercises: pool,
      completedLessonIds: ["l1"],
      attemptStats: noStats,
      rand: lcg(3),
    });
    expect(result.length).toBe(5);
    expect(new Set(result.map((r) => r.id))).toEqual(
      new Set(pool.map((p) => p.id))
    );
  });

  it("mischt auch bei weniger als count (Reihenfolge kann abweichen)", () => {
    const pool = lessonExercises("l1", 6);
    // Mindestens ein Seed von mehreren muss die Reihenfolge veraendern.
    const shuffledAtLeastOnce = [11, 22, 33].some((seed) => {
      const result = selectPracticeExercises({
        exercises: pool,
        completedLessonIds: ["l1"],
        attemptStats: noStats,
        rand: lcg(seed),
      });
      return result.map((r) => r.id).join() !== pool.map((p) => p.id).join();
    });
    expect(shuffledAtLeastOnce).toBe(true);
  });

  it("default count ist 8", () => {
    const result = selectPracticeExercises({
      exercises: lessonExercises("l1", 20),
      completedLessonIds: ["l1"],
      attemptStats: noStats,
      rand: lcg(4),
    });
    expect(result.length).toBe(8);
  });

  it("keine Uebung doppelt (auch bei doppelten Eingabe-Zeilen)", () => {
    const pool = [...lessonExercises("l1", 6), ...lessonExercises("l1", 6)];
    const result = selectPracticeExercises({
      exercises: pool,
      completedLessonIds: ["l1"],
      attemptStats: noStats,
      count: 8,
      rand: lcg(5),
    });
    const ids = result.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(6); // nur 6 verschiedene vorhanden
  });

  it("alles fehlerfrei -> zufaellige Auswahl in gewuenschter Groesse", () => {
    const stats = new Map(
      lessonExercises("l1", 20).map((e) => [
        e.id,
        { correct: 3, wrong: 0 },
      ])
    );
    const result = selectPracticeExercises({
      exercises: lessonExercises("l1", 20),
      completedLessonIds: ["l1"],
      attemptStats: stats,
      count: 8,
      rand: lcg(6),
    });
    expect(result.length).toBe(8);
    expect(new Set(result.map((r) => r.id)).size).toBe(8);
  });

  it("hohe Fehlerquote (>= 0.4) stellt mindestens die Haelfte der Auswahl", () => {
    const hard = lessonExercises("l1", 10); // Fehlerquote 2/3
    const easy = lessonExercises("l2", 10); // Fehlerquote 0
    const stats = new Map<string, { correct: number; wrong: number }>();
    for (const e of hard) stats.set(e.id, { correct: 1, wrong: 2 });
    for (const e of easy) stats.set(e.id, { correct: 3, wrong: 0 });

    for (const seed of [7, 8, 9, 10]) {
      const result = selectPracticeExercises({
        exercises: [...hard, ...easy],
        completedLessonIds: ["l1", "l2"],
        attemptStats: stats,
        count: 8,
        rand: lcg(seed),
      });
      const hardIds = new Set(hard.map((e) => e.id));
      const hardCount = result.filter((r) => hardIds.has(r.id)).length;
      expect(hardCount).toBeGreaterThanOrEqual(4);
    }
  });

  it("Fehlerquote genau 0.4 zaehlt als schwierig", () => {
    const pool = lessonExercises("l1", 12);
    const stats = new Map<string, { correct: number; wrong: number }>();
    // eine Uebung mit exakt 0.4 (2 falsch, 3 richtig), Rest fehlerfrei
    stats.set(pool[0].id, { correct: 3, wrong: 2 });
    for (const e of pool.slice(1)) stats.set(e.id, { correct: 5, wrong: 0 });

    for (const seed of [12, 13, 14]) {
      const result = selectPracticeExercises({
        exercises: pool,
        completedLessonIds: ["l1"],
        attemptStats: stats,
        count: 8,
        rand: lcg(seed),
      });
      expect(result.map((r) => r.id)).toContain(pool[0].id);
    }
  });

  it("weniger Schwierige als die Haelfte -> alle Schwierigen sind dabei", () => {
    const pool = lessonExercises("l1", 20);
    const stats = new Map<string, { correct: number; wrong: number }>();
    stats.set(pool[3].id, { correct: 0, wrong: 4 });
    stats.set(pool[15].id, { correct: 1, wrong: 4 });

    for (const seed of [21, 22, 23]) {
      const ids = selectPracticeExercises({
        exercises: pool,
        completedLessonIds: ["l1"],
        attemptStats: stats,
        count: 8,
        rand: lcg(seed),
      }).map((r) => r.id);
      expect(ids).toContain(pool[3].id);
      expect(ids).toContain(pool[15].id);
    }
  });

  it("bevorzugt einen Mix aus verschiedenen Lektionen", () => {
    const pool = [
      ...lessonExercises("l1", 10),
      ...lessonExercises("l2", 10),
      ...lessonExercises("l3", 10),
    ];
    for (const seed of [31, 32, 33, 34]) {
      const result = selectPracticeExercises({
        exercises: pool,
        completedLessonIds: ["l1", "l2", "l3"],
        attemptStats: noStats,
        count: 8,
        rand: lcg(seed),
      });
      const lessons = new Set(result.map((r) => r.lessonId));
      expect(lessons.size).toBe(3);
    }
  });

  it("Statistik mit 0 Versuchen (correct+wrong = 0) crasht nicht", () => {
    const pool = lessonExercises("l1", 4);
    const stats = new Map(pool.map((e) => [e.id, { correct: 0, wrong: 0 }]));
    const result = selectPracticeExercises({
      exercises: pool,
      completedLessonIds: ["l1"],
      attemptStats: stats,
      rand: lcg(41),
    });
    expect(result.length).toBe(4);
  });

  it("gleicher Seed -> gleiches Ergebnis (deterministisch)", () => {
    const pool = [...lessonExercises("l1", 10), ...lessonExercises("l2", 10)];
    const run = () =>
      selectPracticeExercises({
        exercises: pool,
        completedLessonIds: ["l1", "l2"],
        attemptStats: noStats,
        count: 8,
        rand: lcg(99),
      }).map((r) => r.id);
    expect(run()).toEqual(run());
  });

  it("veraendert die Eingaben nicht (pure)", () => {
    const pool = lessonExercises("l1", 10);
    const snapshot = JSON.parse(JSON.stringify(pool));
    selectPracticeExercises({
      exercises: pool,
      completedLessonIds: ["l1"],
      attemptStats: noStats,
      count: 4,
      rand: lcg(50),
    });
    expect(pool).toEqual(snapshot);
  });
});
