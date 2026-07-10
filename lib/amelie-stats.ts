// Auswertung von Amelies Fortschritt fuer die Mama-Statistik-Seite.
// Reine Funktionen (hier getestet) + ein Fetch-Orchestrator, der die Daten
// aus Supabase holt (alles Lesezugriffe, per RLS erlaubt).
import {
  fetchPath,
  fetchProgress,
  fetchDailyActivity,
  fetchAttemptStatsWithLessons,
  fetchExercisesForLessons,
  fetchWrongAnswers,
} from "@/lib/data";
import { AMELIE_DEVICE_ID } from "@/lib/device";
import type { ProgressRow, TopicWithLessons } from "@/lib/types";

export type AttemptStat = { correct: number; wrong: number };

export type TopicStat = {
  slug: string;
  title: string;
  icon: string;
  lessonsDone: number;
  lessonsTotal: number;
  /** Antworten (Versuche) gesamt in diesem Thema. */
  correct: number;
  wrong: number;
  /** Anteil richtiger Antworten 0..1, oder null wenn noch nichts gemacht. */
  accuracy: number | null;
};

export type DifficultExercise = {
  exerciseId: string;
  prompt: string;
  lessonTitle: string;
  topicTitle: string;
  topicIcon: string;
  wrong: number;
  total: number;
  /** Richtige Antwort (bei Quiz-Fragen). */
  correctAnswer?: string;
  /** Was Amelie falsch angeklickt hat (nur bei neueren Versuchen erfasst). */
  givenAnswers: string[];
};

export type AmelieStats = {
  lessonsDone: number;
  lessonsTotal: number;
  totalXp: number;
  correct: number;
  wrong: number;
  accuracy: number | null;
  topics: TopicStat[];
  strengths: TopicStat[];
  needsPractice: TopicStat[];
  difficult: DifficultExercise[];
};

/**
 * Rechnet pro Thema: geschaffte Lektionen, richtige/falsche Antworten und
 * die Trefferquote. Rein – keine Netzwerkzugriffe.
 */
export function computeTopicStats(
  topics: TopicWithLessons[],
  progress: ProgressRow[],
  attemptStats: Map<string, AttemptStat>,
  exerciseToLesson: Map<string, string>
): TopicStat[] {
  const doneLessonIds = new Set(progress.map((p) => p.lesson_id));

  // lessonId -> topic (fuer die Zuordnung der Versuche)
  const lessonToTopic = new Map<string, string>();
  for (const topic of topics) {
    for (const lesson of topic.lessons) {
      lessonToTopic.set(lesson.id, topic.slug);
    }
  }

  // Versuche je Thema aufsummieren.
  const byTopic = new Map<string, AttemptStat>();
  for (const [exerciseId, stat] of attemptStats) {
    const lessonId = exerciseToLesson.get(exerciseId);
    if (!lessonId) continue;
    const topicSlug = lessonToTopic.get(lessonId);
    if (!topicSlug) continue;
    const entry = byTopic.get(topicSlug) ?? { correct: 0, wrong: 0 };
    entry.correct += stat.correct;
    entry.wrong += stat.wrong;
    byTopic.set(topicSlug, entry);
  }

  return topics.map((topic) => {
    const attempts = byTopic.get(topic.slug) ?? { correct: 0, wrong: 0 };
    const answered = attempts.correct + attempts.wrong;
    return {
      slug: topic.slug,
      title: topic.title,
      icon: topic.icon,
      lessonsDone: topic.lessons.filter((l) => doneLessonIds.has(l.id)).length,
      lessonsTotal: topic.lessons.length,
      correct: attempts.correct,
      wrong: attempts.wrong,
      accuracy: answered > 0 ? attempts.correct / answered : null,
    };
  });
}

/** Themen mit Aktivitaet, sortiert nach Trefferquote (beste zuerst). */
export function rankTopics(stats: TopicStat[]): {
  strengths: TopicStat[];
  needsPractice: TopicStat[];
} {
  const active = stats.filter((s) => s.accuracy !== null);
  const byAccuracyDesc = [...active].sort(
    (a, b) => (b.accuracy ?? 0) - (a.accuracy ?? 0)
  );
  const strengths = byAccuracyDesc.filter((s) => (s.accuracy ?? 0) >= 0.8);
  const needsPractice = [...active]
    .filter((s) => (s.accuracy ?? 1) < 0.8)
    .sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0));
  return { strengths, needsPractice };
}

/**
 * Die schwierigsten Uebungen: mind. 1 Fehler, nach Fehlerzahl sortiert.
 * `prompts` liefert Prompt + Lektions-/Themen-Namen je exerciseId.
 */
export type ExerciseMeta = {
  prompt: string;
  lessonTitle: string;
  topicTitle: string;
  topicIcon: string;
  correctAnswer?: string;
};

export function topDifficultExercises(
  attemptStats: Map<string, AttemptStat>,
  prompts: Map<string, ExerciseMeta>,
  wrongAnswers: Map<string, string[]> = new Map(),
  limit = 8
): DifficultExercise[] {
  const list: DifficultExercise[] = [];
  for (const [exerciseId, stat] of attemptStats) {
    if (stat.wrong < 1) continue;
    const meta = prompts.get(exerciseId);
    if (!meta) continue;
    list.push({
      exerciseId,
      prompt: meta.prompt,
      lessonTitle: meta.lessonTitle,
      topicTitle: meta.topicTitle,
      topicIcon: meta.topicIcon,
      wrong: stat.wrong,
      total: stat.correct + stat.wrong,
      correctAnswer: meta.correctAnswer,
      givenAnswers: wrongAnswers.get(exerciseId) ?? [],
    });
  }
  return list.sort((a, b) => b.wrong - a.wrong).slice(0, limit);
}

/** Laedt und rechnet Amelies komplette Statistik (fuer die Mama-Seite). */
export async function fetchAmelieStats(): Promise<AmelieStats> {
  const [topics, progress, activity, attempts] = await Promise.all([
    fetchPath(),
    fetchProgress(AMELIE_DEVICE_ID),
    fetchDailyActivity(AMELIE_DEVICE_ID),
    fetchAttemptStatsWithLessons(AMELIE_DEVICE_ID),
  ]);

  const topicStats = computeTopicStats(
    topics,
    progress,
    attempts.stats,
    attempts.exerciseToLesson
  );
  const { strengths, needsPractice } = rankTopics(topicStats);

  // Prompt + Themen-/Lektions-Namen fuer die schwierigen Uebungen nachladen.
  const wrongLessonIds = new Set<string>();
  for (const [exerciseId, stat] of attempts.stats) {
    if (stat.wrong >= 1) {
      const lessonId = attempts.exerciseToLesson.get(exerciseId);
      if (lessonId) wrongLessonIds.add(lessonId);
    }
  }
  const lessonMeta = new Map<string, { title: string; topicTitle: string; topicIcon: string }>();
  for (const topic of topics) {
    for (const lesson of topic.lessons) {
      lessonMeta.set(lesson.id, {
        title: lesson.title,
        topicTitle: topic.title,
        topicIcon: topic.icon,
      });
    }
  }
  const prompts = new Map<string, ExerciseMeta>();
  const difficultIds: string[] = [];
  for (const [exerciseId, stat] of attempts.stats) {
    if (stat.wrong >= 1) difficultIds.push(exerciseId);
  }
  if (wrongLessonIds.size > 0) {
    const exercises = await fetchExercisesForLessons([...wrongLessonIds]);
    for (const ex of exercises) {
      const meta = lessonMeta.get(ex.lesson_id);
      const data = ex.data as {
        prompt?: string;
        options?: { text: string; correct?: boolean }[];
      };
      // Richtige Antwort nur bei Quiz-Fragen (multiple_choice) ablesbar.
      const correctAnswer =
        ex.type === "multiple_choice"
          ? data.options?.find((o) => o.correct)?.text
          : undefined;
      prompts.set(ex.id, {
        prompt: data?.prompt ?? "(ohne Text)",
        lessonTitle: meta?.title ?? "",
        topicTitle: meta?.topicTitle ?? "",
        topicIcon: meta?.topicIcon ?? "📘",
        correctAnswer,
      });
    }
  }
  // Amelies falsch angeklickte Antworten zu diesen Uebungen nachladen.
  const wrongAnswers = await fetchWrongAnswers(AMELIE_DEVICE_ID, difficultIds);
  const difficult = topDifficultExercises(attempts.stats, prompts, wrongAnswers);

  let correct = 0;
  let wrong = 0;
  for (const stat of attempts.stats.values()) {
    correct += stat.correct;
    wrong += stat.wrong;
  }
  const answered = correct + wrong;

  return {
    lessonsDone: new Set(progress.map((p) => p.lesson_id)).size,
    lessonsTotal: topics.reduce((n, t) => n + t.lessons.length, 0),
    totalXp: activity.reduce((sum, a) => sum + a.xp, 0),
    correct,
    wrong,
    accuracy: answered > 0 ? correct / answered : null,
    topics: topicStats,
    strengths,
    needsPractice,
    difficult,
  };
}
