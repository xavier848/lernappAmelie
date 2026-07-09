import { describe, expect, it } from "vitest";
import { buildSuggestions, type Suggestion } from "./suggestions";
import type { LessonRow, ProgressRow, TopicWithLessons } from "@/lib/types";

// ---------------------------------------------------------------------------
// Test-Helfer: kompakte Fabriken fuer Themen, Lektionen und Fortschritt.
// ---------------------------------------------------------------------------

function lesson(id: string, topicId: string, sort: number): LessonRow {
  return {
    id,
    topic_id: topicId,
    slug: `lektion-${id}`,
    title: `Lektion ${id}`,
    sort,
    published: true,
    created_at: "2026-07-09T00:00:00Z",
  };
}

function topic(
  id: string,
  lessons: LessonRow[],
  sort = 0
): TopicWithLessons {
  return {
    id,
    slug: `thema-${id}`,
    title: `Thema ${id}`,
    icon: "📘",
    sort,
    published: true,
    lessons,
  };
}

function done(lessonId: string): ProgressRow {
  return {
    id: `p-${lessonId}`,
    device_id: "device-1",
    lesson_id: lessonId,
    stars: 2,
    xp: 50,
    completed_at: "2026-07-09T00:00:00Z",
  };
}

function stats(
  entries: [string, { correct: number; wrong: number }][]
): Map<string, { correct: number; wrong: number }> {
  return new Map(entries);
}

const NO_STATS = stats([]);
const NO_MAPPING = new Map<string, string>();

/** Zwei Themen à zwei Lektionen - Standard-Aufbau fuer viele Tests. */
function twoTopics(): TopicWithLessons[] {
  return [
    topic("a", [lesson("a1", "a", 1), lesson("a2", "a", 2)], 0),
    topic("b", [lesson("b1", "b", 1), lesson("b2", "b", 2)], 1),
  ];
}

function kinds(suggestions: Suggestion[]): string[] {
  return suggestions.map((s) => s.kind);
}

describe("buildSuggestions", () => {
  // -------------------------------------------------------------------------
  // Kein Fortschritt
  // -------------------------------------------------------------------------

  it("ohne Fortschritt gibt es nur 'neues' (erste Lektion eines Themas)", () => {
    const result = buildSuggestions({
      topics: twoTopics(),
      progress: [],
      attemptStats: NO_STATS,
      exerciseToLesson: NO_MAPPING,
      todaySeed: "2026-07-09",
    });

    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("neues");
    // Immer die erste (offene) Lektion des gewaehlten Themas.
    expect(["lektion-a1", "lektion-b1"]).toContain(result[0].lessonSlug);
    expect(result[0].grund).toBe("Probier mal etwas Neues!");
  });

  it("'neues' rotiert deterministisch mit dem todaySeed", () => {
    const build = (seed: string) =>
      buildSuggestions({
        topics: twoTopics(),
        progress: [],
        attemptStats: NO_STATS,
        exerciseToLesson: NO_MAPPING,
        todaySeed: seed,
      })[0].lessonSlug;

    // Gleicher Seed -> gleiches Ergebnis (deterministisch).
    expect(build("2026-07-09")).toBe(build("2026-07-09"));

    // Verschiedene Seeds erreichen ueber die Zeit verschiedene Themen
    // (Rotation statt immer derselbe Vorschlag).
    const seen = new Set(
      ["a", "b", "c", "d", "e", "f", "g"].map((seed) => build(seed))
    );
    expect(seen.size).toBeGreaterThan(1);
  });

  it("'neues' fuellt Suggestion-Felder aus dem Thema", () => {
    const topics = [topic("a", [lesson("a1", "a", 1)])];
    const [suggestion] = buildSuggestions({
      topics,
      progress: [],
      attemptStats: NO_STATS,
      exerciseToLesson: NO_MAPPING,
      todaySeed: "x",
    });

    expect(suggestion).toEqual({
      kind: "neues",
      lessonSlug: "lektion-a1",
      lessonTitle: "Lektion a1",
      topicIcon: "📘",
      topicTitle: "Thema a",
      grund: "Probier mal etwas Neues!",
    });
  });

  it("Themen ohne Lektionen werden fuer 'neues' uebersprungen", () => {
    const topics = [topic("leer", []), topic("a", [lesson("a1", "a", 1)])];
    const result = buildSuggestions({
      topics,
      progress: [],
      attemptStats: NO_STATS,
      exerciseToLesson: NO_MAPPING,
      todaySeed: "x",
    });

    expect(result).toHaveLength(1);
    expect(result[0].lessonSlug).toBe("lektion-a1");
  });

  // -------------------------------------------------------------------------
  // weitermachen
  // -------------------------------------------------------------------------

  it("angefangenes Thema ergibt 'weitermachen' mit der naechsten offenen Lektion", () => {
    const topics = [
      topic("a", [lesson("a1", "a", 1), lesson("a2", "a", 2), lesson("a3", "a", 3)]),
    ];
    const result = buildSuggestions({
      topics,
      progress: [done("a1")],
      attemptStats: NO_STATS,
      exerciseToLesson: NO_MAPPING,
      todaySeed: "x",
    });

    expect(kinds(result)).toEqual(["weitermachen"]);
    expect(result[0].lessonSlug).toBe("lektion-a2");
    expect(result[0].grund).toBe("Mach das Thema fertig!");
  });

  it("'weitermachen' respektiert die sort-Reihenfolge der Lektionen", () => {
    const topics = [
      // absichtlich unsortiert uebergeben
      topic("a", [lesson("a3", "a", 3), lesson("a1", "a", 1), lesson("a2", "a", 2)]),
    ];
    const result = buildSuggestions({
      topics,
      progress: [done("a1")],
      attemptStats: NO_STATS,
      exerciseToLesson: NO_MAPPING,
      todaySeed: "x",
    });

    expect(result[0].lessonSlug).toBe("lektion-a2");
  });

  it("fertiges Thema ergibt kein 'weitermachen'", () => {
    const topics = [topic("a", [lesson("a1", "a", 1), lesson("a2", "a", 2)])];
    const result = buildSuggestions({
      topics,
      progress: [done("a1"), done("a2")],
      attemptStats: NO_STATS,
      exerciseToLesson: NO_MAPPING,
      todaySeed: "x",
    });

    expect(kinds(result)).not.toContain("weitermachen");
  });

  // -------------------------------------------------------------------------
  // wiederholen
  // -------------------------------------------------------------------------

  it("abgeschlossene Lektion mit den meisten Fehlern ergibt 'wiederholen'", () => {
    const topics = [
      topic("a", [lesson("a1", "a", 1), lesson("a2", "a", 2), lesson("a3", "a", 3)]),
    ];
    const result = buildSuggestions({
      topics,
      progress: [done("a1"), done("a2")],
      attemptStats: stats([
        ["ex1", { correct: 2, wrong: 1 }], // Lektion a1: 1 Fehler
        ["ex2", { correct: 0, wrong: 2 }], // Lektion a2: 3 Fehler
        ["ex3", { correct: 1, wrong: 1 }],
      ]),
      exerciseToLesson: new Map([
        ["ex1", "a1"],
        ["ex2", "a2"],
        ["ex3", "a2"],
      ]),
      todaySeed: "x",
    });

    expect(result[0].kind).toBe("wiederholen");
    expect(result[0].lessonSlug).toBe("lektion-a2");
    expect(result[0].grund).toBe(
      "Hier hattest du letztes Mal Fehler. Übung macht den Meister!"
    );
  });

  it("nicht abgeschlossene Lektionen ergeben kein 'wiederholen', auch mit Fehlern", () => {
    const topics = [topic("a", [lesson("a1", "a", 1), lesson("a2", "a", 2)])];
    const result = buildSuggestions({
      topics,
      progress: [done("a1")],
      attemptStats: stats([["ex2", { correct: 0, wrong: 5 }]]),
      exerciseToLesson: new Map([["ex2", "a2"]]), // a2 ist NICHT abgeschlossen
      todaySeed: "x",
    });

    expect(kinds(result)).not.toContain("wiederholen");
  });

  it("ohne falsche Versuche gibt es kein 'wiederholen'", () => {
    const topics = [topic("a", [lesson("a1", "a", 1), lesson("a2", "a", 2)])];
    const result = buildSuggestions({
      topics,
      progress: [done("a1")],
      attemptStats: stats([["ex1", { correct: 4, wrong: 0 }]]),
      exerciseToLesson: new Map([["ex1", "a1"]]),
      todaySeed: "x",
    });

    expect(kinds(result)).not.toContain("wiederholen");
  });

  it("leere attemptStats ergeben kein 'wiederholen'", () => {
    const topics = [topic("a", [lesson("a1", "a", 1), lesson("a2", "a", 2)])];
    const result = buildSuggestions({
      topics,
      progress: [done("a1")],
      attemptStats: NO_STATS,
      exerciseToLesson: NO_MAPPING,
      todaySeed: "x",
    });

    expect(kinds(result)).toEqual(["weitermachen"]);
  });

  it("Versuche ohne Lektions-Zuordnung werden ignoriert", () => {
    const topics = [topic("a", [lesson("a1", "a", 1)])];
    const result = buildSuggestions({
      topics,
      progress: [done("a1")],
      attemptStats: stats([["ex-unbekannt", { correct: 0, wrong: 3 }]]),
      exerciseToLesson: NO_MAPPING, // Zuordnung fehlt
      todaySeed: "x",
    });

    expect(kinds(result)).not.toContain("wiederholen");
  });

  // -------------------------------------------------------------------------
  // Kombination, Reihenfolge, Kantenfaelle
  // -------------------------------------------------------------------------

  it("Reihenfolge ist wiederholen, weitermachen, neues - ohne doppelte Lektionen", () => {
    const topics = [
      topic("a", [lesson("a1", "a", 1), lesson("a2", "a", 2)], 0), // angefangen
      topic("b", [lesson("b1", "b", 1)], 1), // unberuehrt
    ];
    const result = buildSuggestions({
      topics,
      progress: [done("a1")],
      attemptStats: stats([["ex1", { correct: 1, wrong: 2 }]]),
      exerciseToLesson: new Map([["ex1", "a1"]]),
      todaySeed: "x",
    });

    expect(kinds(result)).toEqual(["wiederholen", "weitermachen", "neues"]);
    expect(result.map((s) => s.lessonSlug)).toEqual([
      "lektion-a1",
      "lektion-a2",
      "lektion-b1",
    ]);
    const slugs = result.map((s) => s.lessonSlug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("maximal 3 Vorschlaege, maximal 1 pro Art", () => {
    const topics = [
      topic("a", [lesson("a1", "a", 1), lesson("a2", "a", 2)], 0),
      topic("b", [lesson("b1", "b", 1), lesson("b2", "b", 2)], 1),
      topic("c", [lesson("c1", "c", 1)], 2),
      topic("d", [lesson("d1", "d", 1)], 3),
    ];
    const result = buildSuggestions({
      topics,
      progress: [done("a1"), done("b1")],
      attemptStats: stats([
        ["ex1", { correct: 0, wrong: 1 }],
        ["ex2", { correct: 0, wrong: 1 }],
      ]),
      exerciseToLesson: new Map([
        ["ex1", "a1"],
        ["ex2", "b1"],
      ]),
      todaySeed: "x",
    });

    expect(result.length).toBeLessThanOrEqual(3);
    expect(kinds(result)).toEqual(["wiederholen", "weitermachen", "neues"]);
  });

  it("alles fertig mit Fehlern: nur 'wiederholen'", () => {
    const topics = [topic("a", [lesson("a1", "a", 1), lesson("a2", "a", 2)])];
    const result = buildSuggestions({
      topics,
      progress: [done("a1"), done("a2")],
      attemptStats: stats([["ex1", { correct: 1, wrong: 1 }]]),
      exerciseToLesson: new Map([["ex1", "a1"]]),
      todaySeed: "x",
    });

    expect(kinds(result)).toEqual(["wiederholen"]);
    expect(result[0].lessonSlug).toBe("lektion-a1");
  });

  it("alles fertig ohne Fehler: keine Vorschlaege", () => {
    const topics = [topic("a", [lesson("a1", "a", 1)])];
    const result = buildSuggestions({
      topics,
      progress: [done("a1")],
      attemptStats: NO_STATS,
      exerciseToLesson: NO_MAPPING,
      todaySeed: "x",
    });

    expect(result).toEqual([]);
  });

  it("leere Themenliste ergibt keine Vorschlaege", () => {
    expect(
      buildSuggestions({
        topics: [],
        progress: [],
        attemptStats: NO_STATS,
        exerciseToLesson: NO_MAPPING,
        todaySeed: "x",
      })
    ).toEqual([]);
  });
});
