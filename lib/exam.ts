// Prüfungs-Simulation + Bereitschafts-Check - reine Logik, testbar.
import { CATEGORIES, type Category } from "@/lib/categories";
import type { TopicWithLessons } from "@/lib/types";

export type Verdict = "bereit" | "fast" | "ueben" | "wenig";

export type CategoryReadiness = {
  slug: string;
  title: string;
  icon: string;
  correct: number;
  total: number;
  ratio: number;
  verdict: Verdict;
};

/** So viele beantwortete Übungen braucht ein Bereich für ein Urteil. */
export const MIN_FOR_VERDICT = 4;

/** topic_slug → Kategorie (für die Zuordnung der Übungen zu Bereichen). */
function topicToCategory(): Map<string, Category> {
  const map = new Map<string, Category>();
  for (const cat of CATEGORIES) {
    for (const slug of cat.topicSlugs) map.set(slug, cat);
  }
  return map;
}

export function verdictFor(ratio: number, total: number): Verdict {
  if (total < MIN_FOR_VERDICT) return "wenig";
  if (ratio >= 0.8) return "bereit";
  if (ratio >= 0.6) return "fast";
  return "ueben";
}

/**
 * Bereitschaft je Bereich aus den bisherigen Versuchen.
 * attemptStats: exerciseId → {correct, wrong}. exerciseToLesson: exId → lessonId.
 * lessonToTopic: lessonId → topic_slug.
 */
export function computeReadiness(params: {
  attemptStats: Map<string, { correct: number; wrong: number }>;
  exerciseToLesson: Map<string, string>;
  lessonToTopic: Map<string, string>;
}): CategoryReadiness[] {
  const cat2 = topicToCategory();
  const agg = new Map<string, { correct: number; total: number }>();

  for (const [exId, stat] of params.attemptStats) {
    const lessonId = params.exerciseToLesson.get(exId);
    if (!lessonId) continue;
    const topic = params.lessonToTopic.get(lessonId);
    if (!topic) continue;
    const cat = cat2.get(topic);
    if (!cat) continue;
    const cur = agg.get(cat.slug) ?? { correct: 0, total: 0 };
    cur.correct += stat.correct;
    cur.total += stat.correct + stat.wrong;
    agg.set(cat.slug, cur);
  }

  return CATEGORIES.map((cat) => {
    const a = agg.get(cat.slug) ?? { correct: 0, total: 0 };
    const ratio = a.total > 0 ? a.correct / a.total : 0;
    return {
      slug: cat.slug,
      title: cat.title,
      icon: cat.icon,
      correct: a.correct,
      total: a.total,
      ratio,
      verdict: verdictFor(ratio, a.total),
    };
  });
}

/**
 * Wählt für die Probe-Prüfung Lektions-IDs aus, breit über die Bereiche
 * verteilt (Round-Robin über Kategorien, je Kategorie gemischte Lektionen).
 */
export function pickExamLessonIds(
  categories: { topics: TopicWithLessons[] }[],
  count: number,
  rand: () => number
): string[] {
  const shuffle = <T,>(arr: readonly T[]): T[] => {
    const c = [...arr];
    for (let i = c.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [c[i], c[j]] = [c[j], c[i]];
    }
    return c;
  };

  // Pro Kategorie eine gemischte Warteschlange von Lektions-IDs.
  const queues = categories
    .map((cat) =>
      shuffle(cat.topics.flatMap((t) => t.lessons).map((l) => l.id))
    )
    .filter((q) => q.length > 0);

  const picked: string[] = [];
  let active = shuffle(queues);
  while (picked.length < count && active.length > 0) {
    const next: string[][] = [];
    for (const q of active) {
      if (picked.length >= count) break;
      const id = q.shift();
      if (id) picked.push(id);
      if (q.length > 0) next.push(q);
    }
    active = next;
  }
  return picked;
}
