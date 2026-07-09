// Pure Wiederholungs-Queue fuer den Lektions-Player (Spec §4.2, Plan Task 9).
// Falsch geloeste Uebungen wandern ans Ende der Warteschlange; die Lektion
// endet erst, wenn alle Uebungen richtig geloest sind. Keine Seiteneffekte –
// der Player haelt den Zustand, diese Funktionen rechnen nur.

export type QueueState = {
  /** Anzahl aller Uebungen der Lektion (fuer den Fortschrittsbalken). */
  total: number;
  /** Indizes der noch offenen Uebungen; queue[0] ist die aktuelle. */
  queue: number[];
  /** Wie viele Uebungen schon richtig geloest sind. */
  solvedCount: number;
  /** Wiederholungs-Zaehler je Uebung (Index = Uebungs-Index). */
  retried: number[];
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
    firstTry: exercises.map(() => false),
  };
}

/** Index der aktuellen Uebung oder null, wenn alles geloest ist. */
export function currentExerciseIndex(state: QueueState): number | null {
  return state.queue.length > 0 ? state.queue[0] : null;
}

/**
 * Verarbeitet das Ergebnis der aktuellen Uebung:
 * richtig -> raus aus der Queue (firstTry je nach Wiederholungs-Zaehler),
 * falsch  -> ans Ende der Queue, retried[i]++.
 * done = true, sobald die Queue leer ist.
 */
export function advanceQueue(
  state: QueueState,
  correct: boolean
): { state: QueueState; done: boolean } {
  const [current, ...rest] = state.queue;
  if (current === undefined) {
    return { state, done: true };
  }

  if (correct) {
    const firstTry = [...state.firstTry];
    firstTry[current] = state.retried[current] === 0;
    return {
      state: {
        ...state,
        queue: rest,
        solvedCount: state.solvedCount + 1,
        firstTry,
      },
      done: rest.length === 0,
    };
  }

  const retried = [...state.retried];
  retried[current] = retried[current] + 1;
  return {
    state: { ...state, queue: [...rest, current], retried },
    done: false,
  };
}

/**
 * Anzahl der Uebungen, die mindestens einmal wiederholt werden mussten
 * (Basis fuer starsForLesson aus lib/scoring).
 */
export function retriedExerciseCount(state: QueueState): number {
  return state.retried.filter((count) => count > 0).length;
}
