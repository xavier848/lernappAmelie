// Vertrag zwischen Lektions-Player und ALLEN Übungskomponenten.
// Der Player erhöht `checkRequested`, wenn „Prüfen" gedrückt wird;
// die Übung antwortet mit genau einem onResult-Aufruf pro Prüf-Vorgang.
export type ExerciseComponentProps<D> = {
  data: D;
  onResult: (r: { correct: boolean }) => void;
  checkRequested: number;
  onReadyChange: (ready: boolean) => void;
};
