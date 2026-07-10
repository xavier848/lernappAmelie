import { describe, expect, it } from "vitest";
import {
  computeTopicStats,
  rankTopics,
  topDifficultExercises,
  type TopicStat,
} from "./amelie-stats";
import type { ProgressRow, TopicWithLessons } from "@/lib/types";

const topics = [
  {
    id: "t1", slug: "kueche", title: "Küche", icon: "🍳", sort: 1, published: true,
    lessons: [
      { id: "l1", topic_id: "t1", slug: "k1", title: "K1", sort: 1, published: true },
      { id: "l2", topic_id: "t1", slug: "k2", title: "K2", sort: 2, published: true },
    ],
  },
  {
    id: "t2", slug: "geld", title: "Geld", icon: "💶", sort: 2, published: true,
    lessons: [
      { id: "l3", topic_id: "t2", slug: "g1", title: "G1", sort: 1, published: true },
    ],
  },
] as unknown as TopicWithLessons[];

const progress = [
  { lesson_id: "l1", stars: 3, xp: 100 },
] as unknown as ProgressRow[];

describe("computeTopicStats", () => {
  it("zählt geschaffte Lektionen und rechnet die Trefferquote je Thema", () => {
    const attempts = new Map([
      ["e1", { correct: 4, wrong: 1 }], // Küche l1
      ["e2", { correct: 1, wrong: 3 }], // Geld l3
    ]);
    const exToLesson = new Map([
      ["e1", "l1"],
      ["e2", "l3"],
    ]);
    const stats = computeTopicStats(topics, progress, attempts, exToLesson);
    const kueche = stats.find((s) => s.slug === "kueche")!;
    const geld = stats.find((s) => s.slug === "geld")!;
    expect(kueche.lessonsDone).toBe(1);
    expect(kueche.lessonsTotal).toBe(2);
    expect(kueche.accuracy).toBeCloseTo(4 / 5);
    expect(geld.accuracy).toBeCloseTo(1 / 4);
  });

  it("accuracy ist null bei Themen ohne Versuche", () => {
    const stats = computeTopicStats(topics, [], new Map(), new Map());
    expect(stats.every((s) => s.accuracy === null)).toBe(true);
  });
});

describe("rankTopics", () => {
  it("trennt Stärken (>=80%) von Übungsbedarf (<80%)", () => {
    const stats: TopicStat[] = [
      { slug: "a", title: "A", icon: "", lessonsDone: 1, lessonsTotal: 1, correct: 9, wrong: 1, accuracy: 0.9 },
      { slug: "b", title: "B", icon: "", lessonsDone: 1, lessonsTotal: 1, correct: 5, wrong: 5, accuracy: 0.5 },
      { slug: "c", title: "C", icon: "", lessonsDone: 0, lessonsTotal: 1, correct: 0, wrong: 0, accuracy: null },
    ];
    const { strengths, needsPractice } = rankTopics(stats);
    expect(strengths.map((s) => s.slug)).toEqual(["a"]);
    expect(needsPractice.map((s) => s.slug)).toEqual(["b"]);
  });
});

describe("topDifficultExercises", () => {
  it("liefert Übungen mit Fehlern, nach Fehlerzahl sortiert", () => {
    const attempts = new Map([
      ["e1", { correct: 1, wrong: 3 }],
      ["e2", { correct: 5, wrong: 0 }],
      ["e3", { correct: 0, wrong: 1 }],
    ]);
    const prompts = new Map([
      ["e1", { prompt: "P1", lessonTitle: "L", topicTitle: "T", topicIcon: "🍳" }],
      ["e3", { prompt: "P3", lessonTitle: "L", topicTitle: "T", topicIcon: "🍳" }],
    ]);
    const result = topDifficultExercises(attempts, prompts);
    expect(result.map((d) => d.exerciseId)).toEqual(["e1", "e3"]);
    expect(result[0].wrong).toBe(3);
  });
});
