// Auswahl-Logik fuer den Ueben-Modus (Wiederholungen).
// Reine Funktion ohne Seiteneffekte: nimmt nur Uebungen aus abgeschlossenen
// Lektionen, bevorzugt Uebungen mit hoher Fehlerquote (>= 0.4, mindestens
// die Haelfte der Auswahl, wenn genug da sind) und mischt den Rest zufaellig.
// Bei der Auswahl wird ein Mix aus verschiedenen Lektionen bevorzugt
// (Round-Robin ueber die Lektionen). rand ist injizierbar fuer Tests.

export type PracticeExercise = {
  id: string;
  lessonId: string;
  type: string;
  data: unknown;
};

export type AttemptStats = Map<string, { correct: number; wrong: number }>;

/** Ab dieser Fehlerquote gilt eine Uebung als "schwierig". */
export const HARD_ERROR_RATE = 0.4;

/** Standard-Anzahl Uebungen pro Ueben-Runde. */
export const DEFAULT_PRACTICE_COUNT = 8;

/** Fisher-Yates-Shuffle (Kopie, veraendert die Eingabe nicht). */
function shuffle<T>(items: readonly T[], rand: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Fehlerquote einer Uebung (0 wenn keine Versuche vorliegen). */
function errorRate(stats: AttemptStats, exerciseId: string): number {
  const entry = stats.get(exerciseId);
  if (!entry) return 0;
  const total = entry.correct + entry.wrong;
  return total > 0 ? entry.wrong / total : 0;
}

/**
 * Waehlt n Uebungen aus items, verteilt ueber moeglichst viele Lektionen:
 * pro Lektion gemischt, dann Round-Robin ueber die (gemischten) Lektionen.
 */
function pickSpreadAcrossLessons(
  items: readonly PracticeExercise[],
  n: number,
  rand: () => number
): PracticeExercise[] {
  if (n <= 0) return [];
  const byLesson = new Map<string, PracticeExercise[]>();
  for (const item of items) {
    const group = byLesson.get(item.lessonId);
    if (group) group.push(item);
    else byLesson.set(item.lessonId, [item]);
  }
  const groups = shuffle(
    [...byLesson.values()].map((group) => shuffle(group, rand)),
    rand
  );

  const picked: PracticeExercise[] = [];
  let offset = 0;
  while (picked.length < n) {
    let tookAny = false;
    for (const group of groups) {
      if (picked.length >= n) break;
      const next = group[offset];
      if (next !== undefined) {
        picked.push(next);
        tookAny = true;
      }
    }
    if (!tookAny) break; // alle Gruppen erschoepft
    offset++;
  }
  return picked;
}

/**
 * Waehlt Uebungen fuer eine Ueben-Runde aus.
 * - nur Uebungen aus abgeschlossenen Lektionen (keine Duplikate),
 * - schwierige Uebungen (Fehlerquote >= 0.4) bevorzugt: mindestens die
 *   Haelfte der Auswahl, wenn genug da sind,
 * - Rest zufaellig aus allen uebrigen, Mix aus verschiedenen Lektionen,
 * - weniger als count verfuegbar -> alle (gemischt).
 */
export function selectPracticeExercises(input: {
  exercises: PracticeExercise[];
  completedLessonIds: string[];
  attemptStats: AttemptStats;
  count?: number;
  rand?: () => number;
}): PracticeExercise[] {
  const count = input.count ?? DEFAULT_PRACTICE_COUNT;
  const rand = input.rand ?? Math.random;
  if (count <= 0) return [];

  // Nur Uebungen aus abgeschlossenen Lektionen, keine Uebung doppelt.
  const completed = new Set(input.completedLessonIds);
  const seen = new Set<string>();
  const pool: PracticeExercise[] = [];
  for (const exercise of input.exercises) {
    if (!completed.has(exercise.lessonId)) continue;
    if (seen.has(exercise.id)) continue;
    seen.add(exercise.id);
    pool.push(exercise);
  }

  if (pool.length === 0) return [];
  if (pool.length <= count) return shuffle(pool, rand);

  // Schwierige Uebungen zuerst: mindestens die Haelfte, wenn genug da sind.
  const hard = pool.filter(
    (exercise) => errorRate(input.attemptStats, exercise.id) >= HARD_ERROR_RATE
  );
  const hardWanted = Math.min(hard.length, Math.ceil(count / 2));
  const hardPick = pickSpreadAcrossLessons(hard, hardWanted, rand);

  // Rest zufaellig aus allen uebrigen (Mix aus Lektionen bevorzugt).
  const pickedIds = new Set(hardPick.map((exercise) => exercise.id));
  const rest = pool.filter((exercise) => !pickedIds.has(exercise.id));
  const restPick = pickSpreadAcrossLessons(
    rest,
    count - hardPick.length,
    rand
  );

  // Gesamtauswahl nochmal mischen, damit Schwieriges nicht vorne klumpt.
  return shuffle([...hardPick, ...restPick], rand);
}
