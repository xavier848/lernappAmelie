// Intelligente Wiederholung (Spaced Repetition) - reine Logik, testbar.
// Aus den Versuchen (exercise_attempts) wird pro Übung berechnet, WANN sie
// wieder fällig ist: nach jeder richtigen Antwort in Folge wächst der Abstand
// (1, 2, 4, 8, 16, 32 Tage). Eine falsche Antwort setzt zurück → sofort fällig.
// So kommt Stoff genau dann wieder, bevor er vergessen wird - die wirksamste
// Methode fürs Langzeitgedächtnis (wichtig für Amelies Prüfung).

export type RawAttempt = {
  exercise_id: string;
  correct: boolean;
  created_at: string;
};

export type DueItem = {
  exerciseId: string;
  /** Wie viele Tage die Übung schon überfällig ist (0 = heute fällig). */
  overdueDays: number;
};

/** Abstände in Tagen je Korrekt-Streak (1., 2., 3. … richtige Antwort). */
export const INTERVALS = [1, 2, 4, 8, 16, 32] as const;

/** Datum (YYYY-MM-DD, Europe/Berlin) eines ISO-Zeitstempels. */
function berlinDay(iso: string): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(
    new Date(iso)
  );
}

/** Ganze Tage zwischen zwei YYYY-MM-DD-Daten (b - a). */
function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

/**
 * Berechnet aus allen Versuchen die HEUTE fälligen Übungen, am meisten
 * überfällige zuerst. today = YYYY-MM-DD (Europe/Berlin).
 */
export function buildDueList(
  attempts: readonly RawAttempt[],
  today: string
): DueItem[] {
  // Versuche je Übung sammeln und nach Zeit sortieren.
  const byExercise = new Map<string, RawAttempt[]>();
  for (const a of attempts) {
    const list = byExercise.get(a.exercise_id);
    if (list) list.push(a);
    else byExercise.set(a.exercise_id, [a]);
  }

  const due: DueItem[] = [];
  for (const [exerciseId, list] of byExercise) {
    list.sort((x, y) => x.created_at.localeCompare(y.created_at));
    const last = list[list.length - 1];

    // Korrekt-Streak am Ende zählen.
    let streak = 0;
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].correct) streak++;
      else break;
    }

    const lastDay = berlinDay(last.created_at);
    // Letzte Antwort falsch → sofort fällig. Sonst Abstand nach Streak.
    const interval = streak === 0 ? 0 : INTERVALS[Math.min(streak, INTERVALS.length) - 1];
    const overdue = dayDiff(lastDay, today) - interval;
    if (overdue >= 0) {
      due.push({ exerciseId, overdueDays: overdue });
    }
  }

  due.sort((a, b) => b.overdueDays - a.overdueDays);
  return due;
}
