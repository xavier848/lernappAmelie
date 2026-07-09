// Tages-Vorschlaege fuer die Startseite ("Für dich heute"):
// statt eines langen Lernpfads bekommt Amelie maximal 3 Karten -
// eine zum Wiederholen (Lektion mit Fehlern), eine zum Weitermachen
// (angefangenes Thema) und eine fuer etwas Neues (unberuehrtes Thema,
// rotiert taeglich ueber todaySeed). Reine Funktion ohne Seiteneffekte.
import type { LessonRow, ProgressRow, TopicWithLessons } from "@/lib/types";

export type SuggestionKind = "wiederholen" | "neues" | "weitermachen";

export type Suggestion = {
  kind: SuggestionKind;
  lessonSlug: string;
  lessonTitle: string;
  topicIcon: string;
  topicTitle: string;
  grund: string;
};

export type BuildSuggestionsInput = {
  topics: TopicWithLessons[];
  progress: ProgressRow[];
  attemptStats: Map<string, { correct: number; wrong: number }>;
  /** Zuordnung exerciseId -> lessonId (fuer die Fehler-Summen je Lektion). */
  exerciseToLesson: Map<string, string>;
  /** Heutiges Datum (berlinToday) - macht die 'neues'-Rotation deterministisch. */
  todaySeed: string;
};

/** Deterministischer String-Hash (djb2) fuer die Tages-Rotation. */
function hashString(value: string): number {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 33 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Lektionen eines Themas nach sort (Kopie, veraendert nichts). */
function sortedLessons(topic: TopicWithLessons): LessonRow[] {
  return [...topic.lessons].sort((a, b) => a.sort - b.sort);
}

function toSuggestion(
  kind: SuggestionKind,
  lesson: LessonRow,
  topic: TopicWithLessons,
  grund: string
): Suggestion {
  return {
    kind,
    lessonSlug: lesson.slug,
    lessonTitle: lesson.title,
    topicIcon: topic.icon,
    topicTitle: topic.title,
    grund,
  };
}

/**
 * wiederholen: abgeschlossene Lektion mit den meisten falschen Versuchen
 * (mindestens 1 Fehler). Bei Gleichstand gewinnt die zuerst gefundene
 * Lektion (Themen-/sort-Reihenfolge) - deterministisch.
 */
function pickWiederholen(
  input: BuildSuggestionsInput,
  completed: ReadonlySet<string>
): Suggestion | null {
  const wrongByLesson = new Map<string, number>();
  for (const [exerciseId, entry] of input.attemptStats) {
    const lessonId = input.exerciseToLesson.get(exerciseId);
    if (!lessonId || entry.wrong <= 0) continue;
    wrongByLesson.set(lessonId, (wrongByLesson.get(lessonId) ?? 0) + entry.wrong);
  }

  let best: { lesson: LessonRow; topic: TopicWithLessons; wrong: number } | null =
    null;
  for (const topic of input.topics) {
    for (const lesson of sortedLessons(topic)) {
      if (!completed.has(lesson.id)) continue;
      const wrong = wrongByLesson.get(lesson.id) ?? 0;
      if (wrong < 1) continue;
      if (!best || wrong > best.wrong) best = { lesson, topic, wrong };
    }
  }

  if (!best) return null;
  return toSuggestion(
    "wiederholen",
    best.lesson,
    best.topic,
    "Hier hattest du letztes Mal Fehler. Übung macht den Meister!"
  );
}

/**
 * weitermachen: erstes Thema (nach Themen-Reihenfolge) mit angefangenem,
 * aber nicht fertigem Fortschritt -> naechste offene Lektion.
 */
function pickWeitermachen(
  input: BuildSuggestionsInput,
  completed: ReadonlySet<string>
): Suggestion | null {
  for (const topic of input.topics) {
    const lessons = sortedLessons(topic);
    if (lessons.length === 0) continue;
    const hasProgress = lessons.some((lesson) => completed.has(lesson.id));
    const nextOpen = lessons.find((lesson) => !completed.has(lesson.id));
    if (hasProgress && nextOpen) {
      return toSuggestion("weitermachen", nextOpen, topic, "Mach das Thema fertig!");
    }
  }
  return null;
}

/**
 * neues: erste Lektion eines Themas, in dem noch NICHTS gemacht wurde.
 * Auswahl rotiert deterministisch ueber den todaySeed - so gibt es
 * jeden Tag einen anderen Vorschlag.
 */
function pickNeues(
  input: BuildSuggestionsInput,
  completed: ReadonlySet<string>
): Suggestion | null {
  const candidates: { lesson: LessonRow; topic: TopicWithLessons }[] = [];
  for (const topic of input.topics) {
    const lessons = sortedLessons(topic);
    if (lessons.length === 0) continue;
    if (lessons.some((lesson) => completed.has(lesson.id))) continue;
    candidates.push({ lesson: lessons[0], topic });
  }

  if (candidates.length === 0) return null;
  const pick = candidates[hashString(input.todaySeed) % candidates.length];
  return toSuggestion("neues", pick.lesson, pick.topic, "Probier mal etwas Neues!");
}

/**
 * Baut die Tages-Vorschlaege: max. 1 pro Art, Reihenfolge
 * wiederholen -> weitermachen -> neues, keine Lektion doppelt.
 */
export function buildSuggestions(input: BuildSuggestionsInput): Suggestion[] {
  const completed = new Set(input.progress.map((row) => row.lesson_id));

  const picks = [
    pickWiederholen(input, completed),
    pickWeitermachen(input, completed),
    pickNeues(input, completed),
  ];

  const result: Suggestion[] = [];
  const usedSlugs = new Set<string>();
  for (const pick of picks) {
    if (!pick || usedSlugs.has(pick.lessonSlug)) continue;
    usedSlugs.add(pick.lessonSlug);
    result.push(pick);
  }
  return result;
}
