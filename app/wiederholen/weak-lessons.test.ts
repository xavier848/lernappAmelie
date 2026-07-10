import { describe, expect, it } from "vitest";
import { weakLessonsFrom } from "./page";
import type { TopicWithLessons } from "@/lib/types";

const topics = [
  {
    id: "t1",
    slug: "kueche",
    title: "Küche putzen",
    icon: "🍳",
    sort: 1,
    published: true,
    lessons: [
      { id: "l1", topic_id: "t1", slug: "kueche-1", title: "Reihenfolge", sort: 1, published: true },
      { id: "l2", topic_id: "t1", slug: "kueche-2", title: "Sauber & sicher", sort: 2, published: true },
    ],
  },
] as unknown as TopicWithLessons[];

describe("weakLessonsFrom", () => {
  it("aggregiert Fehler pro Lektion und sortiert absteigend", () => {
    const stats = new Map([
      ["e1", { correct: 1, wrong: 2 }],
      ["e2", { correct: 0, wrong: 3 }],
      ["e3", { correct: 5, wrong: 0 }],
    ]);
    const exerciseToLesson = new Map([
      ["e1", "l1"],
      ["e2", "l2"],
      ["e3", "l1"],
    ]);
    const result = weakLessonsFrom(topics, stats, exerciseToLesson);
    expect(result.map((l) => l.slug)).toEqual(["kueche-2", "kueche-1"]);
    expect(result[0].wrong).toBe(3);
    expect(result[1].wrong).toBe(2);
    expect(result[0].topicIcon).toBe("🍳");
  });

  it("leer ohne Fehler", () => {
    const stats = new Map([["e1", { correct: 4, wrong: 0 }]]);
    const exerciseToLesson = new Map([["e1", "l1"]]);
    expect(weakLessonsFrom(topics, stats, exerciseToLesson)).toEqual([]);
  });

  it("ignoriert Übungen ohne Lektions-Zuordnung", () => {
    const stats = new Map([["fremd", { correct: 0, wrong: 5 }]]);
    expect(weakLessonsFrom(topics, stats, new Map())).toEqual([]);
  });
});
