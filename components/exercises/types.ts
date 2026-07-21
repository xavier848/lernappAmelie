// Vertrag zwischen Lektions-Player und ALLEN Übungskomponenten.
// Der Player erhöht `checkRequested`, wenn „Prüfen" gedrückt wird;
// die Übung antwortet mit genau einem onResult-Aufruf pro Prüf-Vorgang.
// `given` (optional) beschreibt kurz, was die Nutzerin geantwortet hat —
// wird bei falschen Antworten gespeichert, damit Mama sieht, was Amelie
// angeklickt hat.
export type ExerciseResult = { correct: boolean; given?: string };

export type ExerciseComponentProps<D> = {
  data: D;
  onResult: (r: ExerciseResult) => void;
  checkRequested: number;
  onReadyChange: (ready: boolean) => void;
  /** Wievielter Anlauf für DIESE Übung (0 = erster Versuch). Der Player
   *  zählt hoch, wenn eine falsch gelöste Übung wiederholt wird —
   *  Übungen können dann z. B. einen Tipp einblenden. */
  attempt?: number;
};
