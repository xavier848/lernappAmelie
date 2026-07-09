// Tests fuer die reinen Helfer aus lib/data.ts.
// KEINE echten Netzwerk-Calls - nur Queue-Logik, Gruppierung und Datums-Helfer.
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  PENDING_WRITES_KEY,
  berlinToday,
  clearPending,
  enqueuePending,
  groupLessonsByTopic,
  readPending,
  type PendingWrite,
} from "@/lib/data";
import type { LessonRow, TopicRow } from "@/lib/types";

/** Einfacher In-Memory-Mock fuer localStorage. */
function createLocalStorageMock(): Storage {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
}

const lessonWrite: PendingWrite = {
  kind: "lessonResult",
  payload: { deviceId: "dev-1", lessonId: "les-1", stars: 3, xp: 80 },
};

const activityWrite: PendingWrite = {
  kind: "dailyActivity",
  payload: { deviceId: "dev-1", xp: 30, day: "2026-07-09" },
};

describe("pendingWrites-Queue (localStorage)", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createLocalStorageMock());
  });

  it("readPending liefert [] wenn nichts gespeichert ist", () => {
    expect(readPending()).toEqual([]);
  });

  it("enqueuePending + readPending: Roundtrip erhaelt Eintraege in Reihenfolge", () => {
    enqueuePending(lessonWrite);
    enqueuePending(activityWrite);
    expect(readPending()).toEqual([lessonWrite, activityWrite]);
  });

  it("benutzt exakt den Schluessel 'lernapp-pending-writes'", () => {
    enqueuePending(lessonWrite);
    expect(PENDING_WRITES_KEY).toBe("lernapp-pending-writes");
    expect(localStorage.getItem("lernapp-pending-writes")).not.toBeNull();
  });

  it("clearPending leert die Queue", () => {
    enqueuePending(lessonWrite);
    clearPending();
    expect(readPending()).toEqual([]);
    expect(localStorage.getItem(PENDING_WRITES_KEY)).toBeNull();
  });

  it("readPending liefert [] bei kaputtem JSON statt zu werfen", () => {
    localStorage.setItem(PENDING_WRITES_KEY, "{kein json[");
    expect(readPending()).toEqual([]);
  });

  it("readPending liefert [] wenn der Inhalt kein Array ist", () => {
    localStorage.setItem(PENDING_WRITES_KEY, JSON.stringify({ foo: 1 }));
    expect(readPending()).toEqual([]);
  });
});

describe("groupLessonsByTopic", () => {
  const topic = (id: string, sort: number): TopicRow => ({
    id,
    slug: `topic-${id}`,
    title: `Thema ${id}`,
    icon: "📘",
    sort,
    published: true,
  });

  const lesson = (id: string, topicId: string, sort: number): LessonRow => ({
    id,
    topic_id: topicId,
    slug: `lesson-${id}`,
    title: `Lektion ${id}`,
    sort,
    published: true,
    created_at: "2026-07-09T00:00:00Z",
  });

  it("gruppiert Lektionen unter ihr Thema", () => {
    const topics = [topic("a", 1), topic("b", 2)];
    const lessons = [lesson("l1", "a", 1), lesson("l2", "b", 1), lesson("l3", "a", 2)];
    const result = groupLessonsByTopic(topics, lessons);
    expect(result).toHaveLength(2);
    expect(result[0].lessons.map((l) => l.id)).toEqual(["l1", "l3"]);
    expect(result[1].lessons.map((l) => l.id)).toEqual(["l2"]);
  });

  it("sortiert Themen nach sort, dann Lektionen nach sort", () => {
    const topics = [topic("b", 2), topic("a", 1)];
    const lessons = [lesson("l2", "a", 2), lesson("l1", "a", 1), lesson("l3", "b", 1)];
    const result = groupLessonsByTopic(topics, lessons);
    expect(result.map((t) => t.id)).toEqual(["a", "b"]);
    expect(result[0].lessons.map((l) => l.id)).toEqual(["l1", "l2"]);
  });

  it("Thema ohne Lektionen bekommt leeres Array", () => {
    const result = groupLessonsByTopic([topic("a", 1)], []);
    expect(result[0].lessons).toEqual([]);
  });

  it("ignoriert Lektionen mit unbekanntem topic_id", () => {
    const result = groupLessonsByTopic([topic("a", 1)], [lesson("l1", "zzz", 1)]);
    expect(result[0].lessons).toEqual([]);
  });

  it("veraendert die Eingabe-Arrays nicht (pure Funktion)", () => {
    const topics = [topic("b", 2), topic("a", 1)];
    const lessons = [lesson("l2", "a", 2), lesson("l1", "a", 1)];
    groupLessonsByTopic(topics, lessons);
    expect(topics.map((t) => t.id)).toEqual(["b", "a"]);
    expect(lessons.map((l) => l.id)).toEqual(["l2", "l1"]);
  });
});

describe("berlinToday", () => {
  it("liefert ein Datum im Format YYYY-MM-DD", () => {
    expect(berlinToday()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("entspricht Intl.DateTimeFormat sv-SE in Europe/Berlin", () => {
    const expected = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Berlin",
    }).format(new Date());
    expect(berlinToday()).toBe(expected);
  });
});
