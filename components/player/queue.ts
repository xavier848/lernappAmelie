// Pure Wiederholungs-Queue fuer den Lektions-Player (Spec §4.2, Plan Task 9).
// Fehler-Ablauf (Xaviers Feedback vom 2026-07-09): Beim ERSTEN Fehler wird
// dieselbe Uebung SOFORT nochmal versucht (solange der Fehler frisch ist).
// Beim zweiten Fehler in Folge geht es weiter zur naechsten Uebung und die
// falsche wandert ans Ende der Warteschlange. Die Lektion endet erst, wenn
// alle Uebungen richtig geloest sind. Keine Seiteneffekte - der Player haelt
// den Zustand, diese Funktionen rechnen nur.

export type QueueOutcome = "solved" | "retry" | "defer";

export type QueueState = {
  /** Anzahl aller Uebungen der Lektion (fuer den Fortschrittsbalken). */
  total: number;
  /** Indizes der noch offenen Uebungen; queue[0] ist die aktuelle. */
  queue: number[];
  /** Wie viele Uebungen schon richtig geloest sind. */
  solvedCount: number;
  /** Wiederholungs-Zaehler je Uebung (Index = Uebungs-Index). */
  retried: number[];
  /** Fehler in Folge in der AKTUELLEN Praesentation (steuert retry vs. defer). */
  attemptFails: number[];
  /** true, wenn die Uebung beim ersten Versuch sass (erst nach Loesen gesetzt). */
  firstTry: boolean[];
};

/** Startzustand: alle Uebungen in Original-Reihenfolge, nichts geloest. */
export function createQueue(exercises: readonly unknown[]): QueueState {
  return {
    total: exercises.length,
    queue: exercises.map((_, index) => index),
    solvedCount: 0,
    retried: exercises.map(() => 0),
    attemptFails: exercises.map(() => 0),
    firstTry: exercises.map(() => false),
  };
}

/** Index der aktuellen Uebung oder null, wenn alles geloest ist. */
export function currentExerciseIndex(state: QueueState): number | null {
  return state.queue.length > 0 ? state.queue[0] : null;
}

/**
 * Verarbeitet das Ergebnis der aktuellen Uebung:
 * richtig            -> raus aus der Queue (outcome "solved"),
 * 1. Fehler in Folge -> Uebung bleibt vorne, sofort nochmal (outcome "retry"),
 * 2. Fehler in Folge -> ans Ende der Queue (outcome "defer").
 * retried[i] zaehlt JEDEN Fehler (Basis fuer Sterne).
 * done = true, sobald die Queue leer ist.
 */
export function advanceQueue(
  state: QueueState,
  correct: boolean
): { state: QueueState; done: boolean; outcome: QueueOutcome } {
  const [current, ...rest] = state.queue;
  if (current === undefined) {
    return { state, done: true, outcome: "solved" };
  }

  if (correct) {
    const firstTry = [...state.firstTry];
    firstTry[current] = state.retried[current] === 0;
    const attemptFails = [...state.attemptFails];
    attemptFails[current] = 0;
    return {
      state: {
        ...state,
        queue: rest,
        solvedCount: state.solvedCount + 1,
        attemptFails,
        firstTry,
      },
      done: rest.length === 0,
      outcome: "solved",
    };
  }

  const retried = [...state.retried];
  retried[current] = retried[current] + 1;
  const attemptFails = [...state.attemptFails];
  attemptFails[current] = attemptFails[current] + 1;

  // Erster Fehler in dieser Praesentation: sofort nochmal probieren.
  if (attemptFails[current] < 2) {
    return {
      state: { ...state, retried, attemptFails },
      done: false,
      outcome: "retry",
    };
  }

  // Zweiter Fehler in Folge: ans Ende, Zaehler fuer die naechste
  // Praesentation zuruecksetzen.
  attemptFails[current] = 0;
  return {
    state: { ...state, queue: [...rest, current], retried, attemptFails },
    done: false,
    outcome: "defer",
  };
}

/**
 * Anzahl der Uebungen, die mindestens einmal wiederholt werden mussten
 * (Basis fuer starsForLesson aus lib/scoring).
 */
export function retriedExerciseCount(state: QueueState): number {
  return state.retried.filter((count) => count > 0).length;
}
