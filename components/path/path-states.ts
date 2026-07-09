// Reine Pfad-Logik (Spec §4.1): leitet fuer jede Lektion den Zustand
// completed / current / locked ab.
//
// Regeln:
// - Innerhalb eines Themas sind Lektionen linear: die erste nicht
//   abgeschlossene Lektion ist "current", alle danach "locked".
// - Bereits abgeschlossene Lektionen bleiben immer "completed"
//   (auch wenn sie hinter der current-Lektion liegen).
// - Themen sind unabhaengig voneinander: jedes Thema hat seine eigene
//   current-Lektion.
import type { ProgressRow, TopicWithLessons } from "@/lib/types";

export type LessonPathState = {
  state: "completed" | "current" | "locked";
  stars?: number;
};

/**
 * Berechnet je Lektion den Pfad-Zustand.
 * Pure Funktion - veraendert die Eingaben nicht.
 */
export function pathStates(
  topicsWithLessons: TopicWithLessons[],
  progressRows: ProgressRow[]
): Map<string, LessonPathState> {
  const progressByLesson = new Map(
    progressRows.map((row) => [row.lesson_id, row])
  );
  const result = new Map<string, LessonPathState>();

  for (const topic of topicsWithLessons) {
    const lessons = [...topic.lessons].sort((a, b) => a.sort - b.sort);
    let currentAssigned = false;

    for (const lesson of lessons) {
      const progress = progressByLesson.get(lesson.id);
      if (progress) {
        result.set(lesson.id, { state: "completed", stars: progress.stars });
      } else if (!currentAssigned) {
        result.set(lesson.id, { state: "current" });
        currentAssigned = true;
      } else {
        result.set(lesson.id, { state: "locked" });
      }
    }
  }

  return result;
}
