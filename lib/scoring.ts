// Scoring-Regeln laut Spec §5 (Teilpunkte) und §9 (XP & Level).

/**
 * Teilpunkte fuer steps_order: zaehlt, wie viele direkt aufeinanderfolgende
 * Schritt-Paare der Abgabe auch in der korrekten Loesung direkt
 * aufeinanderfolgen. Intern fuer Statistik, nach aussen positiv formuliert.
 */
export function stepsOrderPartial(
  correct: string[],
  given: string[]
): { correctPairs: number; totalPairs: number; perfect: boolean } {
  const totalPairs = Math.max(0, correct.length - 1);

  let correctPairs = 0;
  for (let i = 0; i < correct.length - 1; i++) {
    const index = given.indexOf(correct[i]);
    if (index !== -1 && given[index + 1] === correct[i + 1]) {
      correctPairs++;
    }
  }

  const perfect =
    given.length === correct.length &&
    correct.every((step, i) => given[i] === step);

  return { correctPairs, totalPairs, perfect };
}

/** Uebung richtig beim 1. Versuch = 10 XP, nach Wiederholung = 5 XP. */
export function xpForExercise(firstTry: boolean): number {
  return firstTry ? 10 : 5;
}

/** Bonus fuer eine abgeschlossene Lektion. */
export const LESSON_BONUS_XP = 20;

/** Ueben-Modus: 5 XP pro richtig geloester Uebung, kein Lektions-Bonus. */
export const PRACTICE_XP_PER_EXERCISE = 5;

/**
 * Sterne fuer eine Lektion: 3 = alles beim ersten Versuch,
 * 2 = maximal 2 Wiederholungen, 1 = geschafft.
 */
export function starsForLesson(
  totalExercises: number,
  retriedCount: number
): 1 | 2 | 3 {
  if (retriedCount === 0) return 3;
  if (retriedCount <= 2) return 2;
  return 1;
}

/**
 * Level aus Gesamt-XP: die Schwelle von Level n zu Level n+1 kostet n*100 XP
 * (kumulativ: Level 2 ab 100, Level 3 ab 300, Level 4 ab 600, ...).
 * currentXp = XP innerhalb des aktuellen Levels,
 * nextLevelXp = benoetigte XP bis zum naechsten Level.
 */
export function levelForXp(totalXp: number): {
  level: number;
  currentXp: number;
  nextLevelXp: number;
} {
  let level = 1;
  let remaining = Math.max(0, totalXp);
  while (remaining >= level * 100) {
    remaining -= level * 100;
    level++;
  }
  return { level, currentXp: remaining, nextLevelXp: level * 100 };
}
