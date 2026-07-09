import { describe, expect, it } from "vitest";
import { pathStates } from "./path-states";
import type { LessonRow, ProgressRow, TopicWithLessons } from "@/lib/types";

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

function topic(id: string, lessons: LessonRow[]): TopicWithLessons {
  return {
    id,
    slug: `thema-${id}`,
    title: `Thema ${id}`,
    icon: "📘",
    sort: 0,
    published: true,
    lessons,
  };
}

function done(lessonId: string, stars: number): ProgressRow {
  return {
    id: `p-${lessonId}`,
    device_id: "device-1",
    lesson_id: lessonId,
    stars,
    xp: 50,
    completed_at: "2026-07-09T00:00:00Z",
  };
}

describe("pathStates", () => {
  it("ohne Fortschritt: erste Lektion ist current, der Rest locked", () => {
    const topics = [
      topic("a", [lesson("a1", "a", 1), lesson("a2", "a", 2), lesson("a3", "a", 3)]),
    ];
    const states = pathStates(topics, []);

    expect(states.get("a1")).toEqual({ state: "current" });
    expect(states.get("a2")).toEqual({ state: "locked" });
    expect(states.get("a3")).toEqual({ state: "locked" });
  });

  it("abgeschlossene Lektion ist completed mit Sternen, die naechste current", () => {
    const topics = [
      topic("a", [lesson("a1", "a", 1), lesson("a2", "a", 2), lesson("a3", "a", 3)]),
    ];
    const states = pathStates(topics, [done("a1", 3)]);

    expect(states.get("a1")).toEqual({ state: "completed", stars: 3 });
    expect(states.get("a2")).toEqual({ state: "current" });
    expect(states.get("a3")).toEqual({ state: "locked" });
  });

  it("Themen sind unabhaengig: jedes Thema hat seine eigene current-Lektion", () => {
    const topics = [
      topic("a", [lesson("a1", "a", 1), lesson("a2", "a", 2)]),
      topic("b", [lesson("b1", "b", 1), lesson("b2", "b", 2)]),
    ];
    const states = pathStates(topics, [done("a1", 2)]);

    // Thema A: a1 fertig, a2 dran.
    expect(states.get("a1")).toEqual({ state: "completed", stars: 2 });
    expect(states.get("a2")).toEqual({ state: "current" });
    // Thema B: unabhaengig davon ist b1 frei.
    expect(states.get("b1")).toEqual({ state: "current" });
    expect(states.get("b2")).toEqual({ state: "locked" });
  });

  it("alle Lektionen abgeschlossen: kein current im Thema", () => {
    const topics = [topic("a", [lesson("a1", "a", 1), lesson("a2", "a", 2)])];
    const states = pathStates(topics, [done("a1", 1), done("a2", 3)]);

    expect(states.get("a1")).toEqual({ state: "completed", stars: 1 });
    expect(states.get("a2")).toEqual({ state: "completed", stars: 3 });
  });

  it("completed hinter der current-Lektion bleibt completed", () => {
    const topics = [
      topic("a", [lesson("a1", "a", 1), lesson("a2", "a", 2), lesson("a3", "a", 3)]),
    ];
    // Nur a3 wurde (frueher mal) abgeschlossen.
    const states = pathStates(topics, [done("a3", 2)]);

    expect(states.get("a1")).toEqual({ state: "current" });
    expect(states.get("a2")).toEqual({ state: "locked" });
    expect(states.get("a3")).toEqual({ state: "completed", stars: 2 });
  });

  it("sortiert Lektionen im Thema nach sort, egal wie sie ankommen", () => {
    const topics = [
      topic("a", [lesson("a2", "a", 2), lesson("a1", "a", 1), lesson("a3", "a", 3)]),
    ];
    const states = pathStates(topics, []);

    expect(states.get("a1")).toEqual({ state: "current" });
    expect(states.get("a2")).toEqual({ state: "locked" });
    expect(states.get("a3")).toEqual({ state: "locked" });
  });

  it("leere Eingaben ergeben eine leere Map", () => {
    expect(pathStates([], []).size).toBe(0);
  });
});
